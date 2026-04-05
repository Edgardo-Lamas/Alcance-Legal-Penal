// popup.js — Abre el side panel y cierra el popup
document.getElementById('btn-open').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.sidePanel.open({ tabId: tabs[0].id }).catch(console.error)
    window.close()
  })
})
