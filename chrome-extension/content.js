// ============================================================
// content.js — Extractor del DOM del MEV
// Alcance Legal Penal · MEV Navigator
// Inyectado en: https://mev.scba.gov.ar/*
// ============================================================

;(function () {
  'use strict'

  // Evita doble inyección
  if (window.__ALP_MEV_INJECTED__) return
  window.__ALP_MEV_INJECTED__ = true

  // ── Utilidades de extracción ──────────────────────────────

  function getText(selector, context = document) {
    const el = context.querySelector(selector)
    return el ? el.textContent.trim() : null
  }

  function getTextByLabel(labelText, context = document) {
    // Busca celdas de tabla donde el texto de la celda anterior matchea el label
    const cells = context.querySelectorAll('td, th, span, label, b, strong')
    for (const cell of cells) {
      const text = cell.textContent.trim()
      if (text.toLowerCase().includes(labelText.toLowerCase())) {
        // Intenta el siguiente hermano o la siguiente celda
        const next = cell.nextElementSibling || cell.parentElement?.nextElementSibling?.querySelector('td')
        if (next) return next.textContent.trim()
        // O busca el texto después de los dos puntos
        const full = cell.parentElement?.textContent?.trim()
        if (full) {
          const parts = full.split(':')
          if (parts.length > 1) return parts.slice(1).join(':').trim()
        }
      }
    }
    return null
  }

  function getTableRows(tableSelector) {
    const table = document.querySelector(tableSelector)
    if (!table) return []
    const rows = []
    const trs = table.querySelectorAll('tr')
    trs.forEach((tr) => {
      const cells = Array.from(tr.querySelectorAll('td, th')).map((td) => td.textContent.trim())
      if (cells.some((c) => c.length > 0)) rows.push(cells)
    })
    return rows
  }

  // ── Detección de página ───────────────────────────────────

  function detectPageType() {
    const url = window.location.href
    const body = document.body.innerText.toLowerCase()

    // P7: Detectar login / sesión expirada con múltiples señales
    const hasLoginForm = !!(
      document.querySelector('input[name*="suar" i], input[name*="assword" i], input[id*="suar" i], input[id*="login" i]')
    )
    const hasLoginKeywords = body.includes('contraseña') && body.includes('usuario') && !body.includes('carátula')
    if (url.includes('loguin') || url.includes('login') || hasLoginForm || hasLoginKeywords) {
      return 'login'
    }

    if (
      url.includes('causas') || url.includes('expediente') ||
      url.includes('actuacion') || url.includes('principal') ||
      body.includes('carátula') || body.includes('imputado') ||
      body.includes('actuaciones')
    ) {
      return 'causa'
    }
    if (body.includes('lista') && (body.includes('causa') || body.includes('autorización'))) {
      return 'lista'
    }
    return 'other'
  }

  // ── Extracción de carátula ────────────────────────────────

  function extractCaratula() {
    const data = {
      caratula: null,
      numeroExpediente: null,
      fuero: null,
      departamento: null,
      organismo: null,
      juez: null,
      fiscal: null,
      defensor: null,
      imputado: null,
      delito: null,
      etapaProcesal: null,
      situacion: null,
      cautelar: null,
    }

    // Estrategia 1: buscar por labels conocidos del MEV
    const labelMap = {
      caratula: ['carátula', 'caratula', 'causa'],
      // El MEV rotula "Nº de Expediente" con º ordinal. Ninguna de las variantes
      // anteriores coincidía, así que el número salía del fallback de abajo.
      numeroExpediente: ['nº de expediente', 'n° de expediente', 'expediente',
        'número', 'nro.', 'n° de causa'],
      fuero: ['fuero'],
      departamento: ['departamento', 'depto'],
      organismo: ['organismo', 'tribunal', 'juzgado', 'cámara'],
      juez: ['juez', 'jueza', 'magistrado'],
      fiscal: ['fiscal', 'ministerio público'],
      defensor: ['defensor', 'defensora', 'defensa'],
      imputado: ['imputado', 'imputada', 'acusado', 'procesado'],
      delito: ['delito', 'figura', 'calificación', 'hecho'],
      etapaProcesal: ['etapa', 'instancia', 'estado'],
      situacion: ['situación', 'situacion procesal', 'libertad', 'detenido'],
      cautelar: ['cautelar', 'prisión preventiva', 'excarcelación'],
    }

    for (const [key, labels] of Object.entries(labelMap)) {
      for (const label of labels) {
        const value = getTextByLabel(label)
        if (value && value.length > 1 && value.length < 200) {
          data[key] = value
          break
        }
      }
    }

    // Estrategia 2: buscar en el título de la página
    const titleEl = document.querySelector('h1, h2, .titulo, .caratula, #caratula, .title')
    if (titleEl && !data.caratula) {
      data.caratula = titleEl.textContent.trim()
    }

    // Estrategia 3: buscar en meta o campos ocultos
    const allText = document.body.innerText
    if (!data.numeroExpediente) {
      // Exige la palabra "Expediente": el patrón viejo aceptaba cualquier "N°" y
      // se quedaba con el 1 de "JUZGADO DE EJECUCION EN LO PENAL N°1".
      const match = allText.match(/Expediente\s*(?:N[°º]|Nro\.?)?\s*:?\s*([\d][\d\-/.]*)/i)
      if (match) data.numeroExpediente = match[1]
    }
    if (!data.caratula) {
      const match = allText.match(/Carátula\s*:?\s*([^\n]+)/i)
      if (match) data.caratula = match[1].trim()
    }

    return data
  }

  // ── Extracción de actuaciones ─────────────────────────────

  // Mapeado contra el DOM real del MEV el 2026-08-04 (procesales.asp, causa penal
  // de La Plata, 193 actuaciones). Tres supuestos de la versión anterior eran falsos:
  //   1. No hay <th> en la página — los encabezados son <td class="fondoazul">.
  //   2. No hay PDFs. Cada actuación es un link a proveido.asp que devuelve TEXTO.
  //   3. No hay filas ocultas por paginación: las 193 vienen en el DOM de una.
  function encontrarTablaActuaciones() {
    for (const table of document.querySelectorAll('table')) {
      if (table.rows.length < 2) continue
      const encabezado = Array.from(table.rows[0].cells).map((c) => c.textContent.trim().toLowerCase())
      if (encabezado.includes('fecha') && encabezado.some((h) => h.startsWith('descripc'))) {
        return { table, encabezado }
      }
    }
    return null
  }

  function extractActuaciones() {
    const hallazgo = encontrarTablaActuaciones()
    if (!hallazgo) return []

    const { table, encabezado } = hallazgo
    const col = (nombre) => encabezado.findIndex((h) => h.startsWith(nombre))
    const iFecha = col('fecha')
    const iFojas = col('foja')
    const iFirmado = col('firmado')
    const iDescripcion = col('descripc')

    const actuaciones = []
    const vistos = new Set()

    Array.from(table.rows).slice(1).forEach((tr) => {
      const cells = Array.from(tr.cells)
      if (cells.length < 2) return

      // El link vive en la celda de Descripción y su texto ES el tipo de actuación.
      const celdaDesc = cells[iDescripcion] || cells[cells.length - 1]
      const link = celdaDesc?.querySelector('a[href*="proveido" i]') || celdaDesc?.querySelector('a')
      const tipo = (link?.textContent || celdaDesc?.textContent || '').trim()
      if (!tipo) return

      const url = link?.href || null
      if (url && vistos.has(url)) return
      if (url) vistos.add(url)

      // La celda de fecha trae fecha y hora en dos líneas: "20/07/2026\n17:57:01".
      const crudoFecha = (cells[iFecha]?.innerText || '').trim()
      const fecha = crudoFecha.match(/\d{2}[/-]\d{2}[/-]\d{4}/)?.[0] || null
      const hora = crudoFecha.match(/\d{1,2}:\d{2}(:\d{2})?/)?.[0] || null

      actuaciones.push({
        fecha,
        hora,
        tipo,
        fojas: (cells[iFojas]?.textContent || '').trim() || null,
        // El ícono de la columna "Firmado" indica firma digital del organismo.
        firmado: !!cells[iFirmado]?.querySelector('img'),
        autor: null,
        descripcion: null,
        // El MEV no publica PDFs: el contenido se lee en proveido.asp como texto.
        tieneDocumento: !!url,
        urlProveido: url,
      })
    })

    return actuaciones
  }

  // ── Función principal de extracción ───────────────────────

  function extractAll() {
    const pageType = detectPageType()

    if (pageType === 'login') {
      return { pageType: 'login', error: 'El usuario debe loguearse en el MEV primero.' }
    }

    if (pageType === 'lista') {
      // Extrae lista de causas autorizadas
      const causas = []
      const links = document.querySelectorAll('a')
      links.forEach((link) => {
        const text = link.textContent.trim()
        if (text && text.length > 5 && (link.href.includes('causa') || link.href.includes('expediente'))) {
          causas.push({ texto: text, url: link.href })
        }
      })
      return { pageType: 'lista', causas }
    }

    if (pageType === 'causa') {
      const caratula = extractCaratula()
      const actuaciones = extractActuaciones()
      return {
        pageType: 'causa',
        url: window.location.href,
        extractedAt: new Date().toISOString(),
        caratula,
        actuaciones,
        totalActuaciones: actuaciones.length,
        actuacionesConDocumento: actuaciones.filter((a) => a.tieneDocumento).length,
        rawPageTitle: document.title,
      }
    }

    return { pageType: 'other', url: window.location.href }
  }

  // ── P6: Interceptor de popups ─────────────────────────────
  // El MEV abre documentos con window.open() o target="_blank".
  // El browser bloquea esos popups. Los interceptamos y pedimos
  // al background que abra una pestaña real sin restricción.

  function interceptPopups() {
    // Interceptar target="_blank" en links de documentos
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a')
      if (!link) return
      const href = link.href
      if (!href || href === '#' || href.startsWith('javascript')) return

      const isDoc = /\.(pdf|doc|docx)/i.test(href) || /download|descargar|getdoc/i.test(href)
      const isBlank = link.target === '_blank' || link.target === 'popup'
      if (!isDoc && !isBlank) return

      e.preventDefault()
      e.stopPropagation()
      chrome.runtime.sendMessage({ type: 'OPEN_IN_TAB', url: href })
    }, true)

    // Interceptar window.open para evitar que el bloqueador lo capture
    const _open = window.open.bind(window)
    window.open = function (url, target, features) {
      if (url && typeof url === 'string' && url.startsWith('http')) {
        chrome.runtime.sendMessage({ type: 'OPEN_IN_TAB', url })
        return null
      }
      return _open(url, target, features)
    }
  }

  interceptPopups()

  // ── Comunicación con background/side panel ────────────────

  function sendData() {
    const data = extractAll()
    chrome.runtime.sendMessage({ type: 'MEV_DATA_EXTRACTED', data })
  }

  // Envía datos al cargar la página
  sendData()

  // Escucha cuando el side panel pide re-extracción
  window.addEventListener('ALP_TRIGGER_EXTRACTION', () => {
    sendData()
  })

  // Escucha mensajes directos del side panel (via chrome.tabs.sendMessage)
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'EXTRACT_NOW') {
      const data = extractAll()
      sendResponse(data)
      return true
    }
  })
})()
