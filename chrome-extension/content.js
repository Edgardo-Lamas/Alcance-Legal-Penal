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
    const title = document.title.toLowerCase()
    const body = document.body.innerText.toLowerCase()

    if (url.includes('loguin') || body.includes('contraseña') && body.includes('usuario') && !body.includes('carátula')) {
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
      numeroExpediente: ['número', 'nro.', 'expediente n°', 'n° de causa'],
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
      const match = allText.match(/(?:N[°º]|Nro\.?|Expediente)\s*:?\s*([\d\-\/]+)/i)
      if (match) data.numeroExpediente = match[1]
    }
    if (!data.caratula) {
      const match = allText.match(/Carátula\s*:?\s*([^\n]+)/i)
      if (match) data.caratula = match[1].trim()
    }

    return data
  }

  // ── Extracción de actuaciones ─────────────────────────────

  function extractActuaciones() {
    const actuaciones = []

    // Busca tablas que puedan contener actuaciones
    const tables = document.querySelectorAll('table')

    for (const table of tables) {
      const headers = Array.from(table.querySelectorAll('th')).map((th) => th.textContent.trim().toLowerCase())
      const hasActuaciones =
        headers.some((h) => h.includes('fecha') || h.includes('actuación') || h.includes('tipo') || h.includes('documento'))

      if (!hasActuaciones && table.rows.length < 2) continue

      const rows = table.querySelectorAll('tr')
      rows.forEach((tr, idx) => {
        if (idx === 0) return // skip header
        const cells = Array.from(tr.querySelectorAll('td'))
        if (cells.length < 2) return

        const pdfLinks = tr.querySelectorAll('a[href*=".pdf"], a[href*="pdf"], a[href*="download"], a[href*="descargar"], a[title*="PDF"], a[title*="pdf"]')
        const imgLinks = tr.querySelectorAll('img[src*="pdf"], img[alt*="pdf"], img[src*="doc"]')

        const actuacion = {
          fecha: null,
          tipo: null,
          autor: null,
          descripcion: null,
          tienePdf: pdfLinks.length > 0 || imgLinks.length > 0,
          urlPdf: null,
        }

        // Intenta mapear celdas a campos
        cells.forEach((cell, i) => {
          const text = cell.textContent.trim()
          if (!text) return
          // Detección por posición típica del MEV
          if (i === 0 && /\d{2}[\/\-]\d{2}[\/\-]\d{4}/.test(text)) {
            actuacion.fecha = text
          } else if (i === 1 || headers[i]?.includes('tipo') || headers[i]?.includes('actuación')) {
            actuacion.tipo = text
          } else if (headers[i]?.includes('autor') || headers[i]?.includes('organismo')) {
            actuacion.autor = text
          } else if (i === cells.length - 1 && text.length > 5) {
            actuacion.descripcion = text.substring(0, 150)
          }
        })

        // URL del PDF si existe
        if (pdfLinks.length > 0) {
          const href = pdfLinks[0].href || pdfLinks[0].getAttribute('href')
          if (href) actuacion.urlPdf = href
        }

        if (actuacion.fecha || actuacion.tipo) {
          actuaciones.push(actuacion)
        }
      })
    }

    // Fallback: busca links de PDF directamente en la página
    if (actuaciones.length === 0) {
      const allPdfLinks = document.querySelectorAll('a[href*=".pdf"], a[href*="pdf"], a[href*="descargar"]')
      allPdfLinks.forEach((link) => {
        actuaciones.push({
          fecha: null,
          tipo: link.textContent.trim() || link.title || 'Documento',
          autor: null,
          descripcion: null,
          tienePdf: true,
          urlPdf: link.href,
        })
      })
    }

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
        actuacionesConPdf: actuaciones.filter((a) => a.tienePdf).length,
        rawPageTitle: document.title,
      }
    }

    return { pageType: 'other', url: window.location.href }
  }

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
