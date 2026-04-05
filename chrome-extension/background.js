// ============================================================
// background.js — Service Worker
// Alcance Legal Penal · MEV Navigator
// ============================================================

// Abre el side panel al hacer clic en el ícono de la extensión
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error)

// Escucha mensajes del content script y del side panel
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

  if (message.type === 'GET_TAB_STATUS') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      const isMev = tab?.url?.includes('mev.scba.gov.ar') ?? false
      const isCausa = isMev && (
        tab.url.includes('causas') ||
        tab.url.includes('expediente') ||
        tab.url.includes('actuaciones') ||
        tab.url.includes('principal')
      )
      sendResponse({ isMev, isCausa, url: tab?.url })
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
    const isMev = tab.url?.includes('mev.scba.gov.ar') ?? false
    chrome.runtime.sendMessage({
      type: 'TAB_CHANGED',
      isMev,
      url: tab.url,
    }).catch(() => {})
  })
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return
  const isMev = tab.url?.includes('mev.scba.gov.ar') ?? false
  chrome.runtime.sendMessage({
    type: 'TAB_CHANGED',
    isMev,
    url: tab.url,
  }).catch(() => {})
})
