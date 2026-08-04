// ============================================================
// background.js — Service Worker
// Alcance Legal Penal · MEV Navigator
// ============================================================

// Abre el side panel al hacer clic en el ícono de la extensión
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error)

// Escucha mensajes del content script y del side panel
// URLs reales del MEV, mapeadas contra el sitio el 2026-08-04:
//   loguin.asp → login          POSLoguin.asp → elección de organismo
//   busqueda.asp → búsqueda     resultados.asp → listado de causas
//   procesales.asp → EXPEDIENTE con sus actuaciones
//   proveido.asp → texto de una actuación
// Los patrones viejos ('causas', 'expediente', 'actuaciones', 'principal') no
// coincidían con NINGUNA de estas páginas, así que isCausa daba false siempre.
const RE_MEV = /mev\.scba\.gov\.ar/i
const RE_CAUSA = /\/(procesales|proveido)\.asp/i

const esMev = (url) => RE_MEV.test(url || '')
const esCausa = (url) => esMev(url) && RE_CAUSA.test(url || '')

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'MEV_DATA_EXTRACTED') {
    // Guarda los datos extraídos y notifica al side panel
    chrome.storage.session.set({ mevData: message.data, mevTabId: sender.tab.id })
    // Notifica al side panel si está abierto
    chrome.runtime.sendMessage({ type: 'MEV_DATA_READY', data: message.data }).catch(() => {
      // Side panel no está abierto aún — los datos quedan en session storage
    })
    sendResponse({ ok: true })
  }

  if (message.type === 'REQUEST_EXTRACTION') {
    // Side panel pide extracción de la pestaña activa
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (!tab) return sendResponse({ error: 'No hay pestaña activa' })
      const isMev = tab.url?.includes('mev.scba.gov.ar')
      if (!isMev) return sendResponse({ error: 'No estás en el MEV' })

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: triggerExtraction,
      }).catch((err) => sendResponse({ error: err.message }))

      sendResponse({ ok: true, tabUrl: tab.url })
    })
    return true // respuesta asíncrona
  }

  // P6: Abrir URL en nueva pestaña (elude el bloqueador de popups)
  if (message.type === 'OPEN_IN_TAB') {
    if (message.url) {
      chrome.tabs.create({ url: message.url, active: false })
    }
    sendResponse({ ok: true })
    return true
  }

  if (message.type === 'GET_TAB_STATUS') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      // El panel puede estar enfocado y dejar tabs[0] indefinido: se busca
      // entonces cualquier pestaña del MEV en la ventana antes de rendirse.
      const activa = tabs[0]
      if (esMev(activa?.url)) {
        return sendResponse({ isMev: true, isCausa: esCausa(activa.url), url: activa.url })
      }
      chrome.tabs.query({ currentWindow: true }, (todas) => {
        const enMev = todas.find((t) => esMev(t.url))
        sendResponse({
          isMev: !!enMev,
          isCausa: esCausa(enMev?.url),
          url: enMev?.url ?? activa?.url,
        })
      })
    })
    return true
  }

  return false
})

// Inyecta en content.js para que re-ejecute la extracción
function triggerExtraction() {
  window.dispatchEvent(new CustomEvent('ALP_TRIGGER_EXTRACTION'))
}

// Notifica al side panel cuando cambia de pestaña
chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) return
    chrome.runtime.sendMessage({
      type: 'TAB_CHANGED',
      isMev: esMev(tab.url),
      isCausa: esCausa(tab.url),
      url: tab.url,
    }).catch(() => {})
  })
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return
  chrome.runtime.sendMessage({
    type: 'TAB_CHANGED',
    isMev: esMev(tab.url),
    isCausa: esCausa(tab.url),
    url: tab.url,
  }).catch(() => {})
})
