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

  // El MEV maqueta con tablas ANIDADAS: la celda exterior contiene el texto de toda
  // la página, así que "la primera celda que menciona el label" es casi siempre un
  // contenedor gigante y devuelve basura. Sólo miramos celdas hoja (sin <td> adentro).
  function celdasHoja(context = document) {
    return Array.from(context.querySelectorAll('td, th')).filter((c) => !c.querySelector('td, th'))
  }

  // Los datos del expediente vienen como "Label: valor" DENTRO de la misma celda,
  // no en la celda siguiente. Ojo: el MEV mezcla º (ordinal) y ° (grado) en los
  // rótulos y separa el valor con NBSP (carácter 160), que no siempre cae dentro
  // de \s: por eso se normaliza a espacio común antes de aplicar el patrón.
  function normalizarEspacios(texto) {
    return texto.replace(/[\u00a0\u2007\u202f]/g, ' ').replace(/\s+/g, ' ').trim()
  }
  function valorDeCampo(patronLabel, context = document) {
    const re = new RegExp('^\\s*' + patronLabel + '\\s*:\\s*(.+)$', 'i')
    for (const celda of celdasHoja(context)) {
      const texto = normalizarEspacios(celda.innerText)
      const m = texto.match(re)
      if (m && m[1].trim()) return m[1].trim()
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

    // ── Bloque "Datos del Expediente" ───────────────────────
    // Son cuatro celdas con formato "Label: valor". Es lo único que el MEV
    // publica de la causa: juez, fiscal, defensor y situación NO figuran acá.
    data.caratula = valorDeCampo('Car[áa]tula')
    data.numeroExpediente = valorDeCampo('N[°º]\\s*de\\s*Expediente')
    // "Estado" es lo más cerca de etapa procesal que da el MEV:
    // "En Letra", "Fuera del Organismo - En Cámara", "A Despacho"…
    data.etapaProcesal = valorDeCampo('Estado')

    // ── Encabezado gris: organismo y departamento - fuero ───
    for (const celda of celdasHoja()) {
      const texto = normalizarEspacios(celda.innerText)
      if (texto.length > 120) continue
      if (!data.organismo && /^(juzgado|tribunal|c[áa]mara|sala|fiscal[íi]a|defensor[íi]a|unidad|secretar[íi]a)\b/i.test(texto)) {
        data.organismo = texto
      }
      // Formato "La Plata - Penal"
      const m = texto.match(/^([A-Za-zÁÉÍÓÚÑáéíóúñ.\s/-]{3,40})\s+-\s+(Penal|Civil|Familia|Laboral|Comercial|Contencioso[\w\s]*|Paz)$/i)
      if (m && !data.departamento) {
        data.departamento = m[1].trim()
        data.fuero = m[2].trim()
      }
    }

    // ── Derivados de la carátula ────────────────────────────
    // Formato del MEV: "APELLIDO NOMBRE S/DELITO ..." — antes de S/ va el
    // imputado, después la calificación legal por la que viene rotulada la causa.
    if (data.caratula) {
      const m = data.caratula.match(/^(.+?)\s+S\/\s*(.+)$/i)
      if (m) {
        data.imputado = m[1].trim()
        data.delito = m[2].trim()
      }
    }

    // Último recurso para la carátula si el bloque cambió de forma.
    if (!data.caratula) {
      const match = document.body.innerText.match(/Car[áa]tula\s*:?\s*([^\n]+)/i)
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
