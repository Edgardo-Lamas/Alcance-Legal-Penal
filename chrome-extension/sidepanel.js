// ============================================================
// sidepanel.js — Lógica del panel lateral
// Alcance Legal Penal · MEV Navigator
// ============================================================

;(function () {
  'use strict'

  // ── Estado ───────────────────────────────────────────────

  let state = {
    isMev: false,
    isCausa: false,
    mevData: null,
    config: {
      apiKey: '',
      modelo: 'claude-sonnet-4-5-20251001',
      autoAnalizar: false,
    },
    historial: [],
    analysisInProgress: false,
  }

  // ── DOM refs ──────────────────────────────────────────────

  const $ = (id) => document.getElementById(id)
  const statusDot = $('status-dot')
  const statusText = $('status-text')

  // ── Inicialización ────────────────────────────────────────

  async function init() {
    await loadConfig()
    await loadHistorial()
    setupTabs()
    setupConfigListeners()
    setupAnalisisListeners()
    setupDocumentosListeners()
    setupHistorialListeners()
    checkTabStatus()
    renderHistorial()
  }

  // ── Config ────────────────────────────────────────────────

  async function loadConfig() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['alpConfig'], (result) => {
        if (result.alpConfig) {
          state.config = { ...state.config, ...result.alpConfig }
          applyConfigToUI()
        }
        resolve()
      })
    })
  }

  function applyConfigToUI() {
    $('input-api-key').value = state.config.apiKey || ''
    $('select-modelo').value = state.config.modelo || 'claude-sonnet-4-5-20251001'
    $('toggle-auto-analizar').checked = state.config.autoAnalizar || false
  }

  function saveConfig() {
    const key = $('input-api-key').value.trim()
    const modelo = $('select-modelo').value
    const autoAnalizar = $('toggle-auto-analizar').checked
    state.config = { apiKey: key, modelo, autoAnalizar }
    chrome.storage.local.set({ alpConfig: state.config }, () => {
      const saved = $('config-saved')
      saved.classList.remove('hidden')
      setTimeout(() => saved.classList.add('hidden'), 2000)
    })
  }

  function setupConfigListeners() {
    $('btn-guardar-config').addEventListener('click', saveConfig)
    $('btn-toggle-key').addEventListener('click', () => {
      const input = $('input-api-key')
      input.type = input.type === 'password' ? 'text' : 'password'
    })
    $('btn-config').addEventListener('click', () => switchTab('config'))
  }

  // ── Estado del MEV ────────────────────────────────────────

  function checkTabStatus() {
    chrome.runtime.sendMessage({ type: 'GET_TAB_STATUS' }, (response) => {
      if (chrome.runtime.lastError) return
      updateMevStatus(response)
    })
  }

  function updateMevStatus({ isMev, isCausa, url } = {}) {
    state.isMev = isMev || false
    state.isCausa = isCausa || false

    if (!isMev) {
      setStatus('disconnected', 'Navegá al MEV para comenzar')
      showSection('no-mev')
    } else if (!isCausa) {
      setStatus('connected', 'MEV detectado ✓')
      showSection('mev-sin-causa')
    } else {
      setStatus('connected', 'Causa detectada ✓')
      requestExtraction()
    }
  }

  function setStatus(type, text) {
    statusDot.className = `alp-status__dot alp-status__dot--${type}`
    statusText.textContent = text
  }

  function showSection(sectionId) {
    const sections = ['no-mev', 'mev-sin-causa', 'causa-detectada']
    sections.forEach((id) => {
      const el = $(id)
      if (el) {
        if (id === sectionId) el.classList.remove('hidden')
        else el.classList.add('hidden')
      }
    })
  }

  // ── Extracción de datos ───────────────────────────────────

  function requestExtraction() {
    chrome.runtime.sendMessage({ type: 'REQUEST_EXTRACTION' }, () => {
      if (chrome.runtime.lastError) {
        showError('No se pudo conectar con el MEV.')
      }
    })
  }

  function handleMevData(data) {
    if (!data || data.error) {
      setStatus('error', data?.error || 'Error al leer el MEV')
      showSection('mev-sin-causa')
      return
    }

    if (data.pageType === 'login') {
      setStatus('warning', 'Debés loguearte en el MEV primero')
      showSection('mev-sin-causa')
      $('mev-sin-causa').querySelector('p').textContent = 'Iniciá sesión en el MEV para continuar.'
      return
    }

    if (data.pageType === 'causa') {
      state.mevData = data
      setStatus('connected', `Causa detectada · ${data.actuaciones?.length || 0} actuaciones`)
      showSection('causa-detectada')
      renderCaratulaPreview(data.caratula)
      renderDocumentos(data.actuaciones)

      if (state.config.autoAnalizar && state.config.apiKey) {
        runAnalysis()
      }
    }
  }

  // ── Render carátula preview ───────────────────────────────

  function renderCaratulaPreview(c) {
    const el = $('caratula-preview')
    if (!c) { el.innerHTML = '<p class="alp-hint">No se pudo extraer la carátula automáticamente.</p>'; return }

    const rows = [
      ['Carátula', c.caratula],
      ['Expediente', c.numeroExpediente],
      ['Fuero', c.fuero],
      ['Organismo', c.organismo],
      ['Juez/a', c.juez],
      ['Fiscal', c.fiscal],
      ['Defensor/a', c.defensor],
      ['Imputado/a', c.imputado],
      ['Etapa', c.etapaProcesal],
      ['Situación', c.situacion],
    ].filter(([, v]) => v)

    el.innerHTML = `
      <div class="alp-caratula__title">${c.caratula || 'Causa sin carátula'}</div>
      <div class="alp-caratula__grid">
        ${rows.map(([k, v]) => `
          <span class="alp-caratula__key">${k}</span>
          <span class="alp-caratula__val">${v}</span>
        `).join('')}
      </div>
    `
  }

  // ── Análisis con IA ───────────────────────────────────────

  function setupAnalisisListeners() {
    $('btn-analizar').addEventListener('click', runAnalysis)
    $('btn-reextraer').addEventListener('click', requestExtraction)
    $('btn-copiar-analisis').addEventListener('click', copyAnalysis)
  }

  async function runAnalysis() {
    if (state.analysisInProgress) return
    if (!state.config.apiKey) {
      showError('Configurá tu API Key de Anthropic en la pestaña Config.')
      switchTab('config')
      return
    }
    if (!state.mevData) {
      showError('No hay datos del expediente. Re-extraé primero.')
      return
    }

    state.analysisInProgress = true
    hideError()
    $('analisis-resultado').classList.add('hidden')
    $('analisis-loading').classList.remove('hidden')
    setLoadingMsg('Preparando análisis...')

    try {
      const prompt = buildPrompt(state.mevData)
      setLoadingMsg('Analizando con IA (puede tardar hasta 30s)...')
      const result = await callClaude(prompt)
      renderAnalisis(result)
      guardarEnHistorial(state.mevData, result)
    } catch (err) {
      showError(`Error en el análisis: ${err.message}`)
    } finally {
      state.analysisInProgress = false
      $('analisis-loading').classList.add('hidden')
    }
  }

  function buildPrompt(data) {
    const c = data.caratula || {}
    const acts = data.actuaciones || []

    const actuacionesText = acts.slice(0, 30).map((a, i) =>
      `${i + 1}. [${a.fecha || 'sin fecha'}] ${a.tipo || 'Actuación'} ${a.autor ? `(${a.autor})` : ''} ${a.tienePdf ? '📄' : ''}`
    ).join('\n')

    return `Analizá el siguiente expediente judicial del MEV de la SCBA:

## DATOS DE CARÁTULA
- Carátula: ${c.caratula || 'No disponible'}
- Número de expediente: ${c.numeroExpediente || 'No disponible'}
- Fuero: ${c.fuero || 'Penal'}
- Departamento judicial: ${c.departamento || 'No disponible'}
- Organismo: ${c.organismo || 'No disponible'}
- Juez/a: ${c.juez || 'No disponible'}
- Fiscal: ${c.fiscal || 'No disponible'}
- Defensor/a: ${c.defensor || 'No disponible'}
- Imputado/a: ${c.imputado || 'No disponible'}
- Delito imputado: ${c.delito || 'No disponible'}
- Etapa procesal: ${c.etapaProcesal || 'No disponible'}
- Situación del imputado: ${c.situacion || 'No disponible'}
- Cautelar vigente: ${c.cautelar || 'No disponible'}

## ACTUACIONES DEL EXPEDIENTE (${data.totalActuaciones || acts.length} total)
${actuacionesText || 'No se pudieron extraer las actuaciones.'}

---

Por favor realizá el análisis completo en las 5 fases indicadas.`
  }

  async function callClaude(userPrompt) {
    const SYSTEM_PROMPT = `Sos un asistente de defensa penal especializado en CPP PBA (Ley 11.922).
Trabajás EXCLUSIVAMENTE desde la perspectiva de la defensa.
El principio in dubio pro reo y la presunción de inocencia son tu punto de partida.

Analizá el expediente en 5 fases y respondé con el siguiente formato exacto:

**FASE 1 — Encuadre procesal**
[etapa, situación del imputado, tribunal, fiscal, plazos, cautelares]

**FASE 2 — Análisis de prueba de cargo**
[contradicciones, prueba ilícita (art. 211 CPP PBA), cadena de custodia, testigos con interés]

**FASE 3 — Nulidades y vicios procesales**
[detención sin orden (art. 151), allanamiento irregular (art. 219), declaración sin letrado, violación art. 18 CN]

**FASE 4 — Contraargumentación defensiva**
[artículos CPP PBA, CP, jurisprudencia SCBA y CSJN aplicables]

**FASE 5 — Recomendación estratégica**
[nulidad, excarcelación (art. 169), sobreseimiento (art. 323), recurso extraordinario, CIDH]

Referencias obligatorias:
- Hábeas corpus: Ley 23.098 y art. 18 CN (NUNCA art. 405 CPP PBA)
- Excarcelación: arts. 169 y 189 CPP PBA
- Nulidades absolutas: arts. 201-210 CPP PBA (no requieren protesta previa)
- Prisión preventiva: art. 157 CPP PBA — impugnar por art. 439 CPP PBA

Cuando no hay información suficiente para una fase, indicalo claramente y señalá qué documentos del expediente se necesitarían para completar ese análisis.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': state.config.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: state.config.modelo,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      if (response.status === 401) throw new Error('API Key inválida. Verificá la configuración.')
      if (response.status === 429) throw new Error('Límite de API alcanzado. Esperá un momento.')
      throw new Error(err?.error?.message || `Error ${response.status} de la API`)
    }

    const data = await response.json()
    return data.content?.[0]?.text || 'Sin respuesta de la IA.'
  }

  function renderAnalisis(text) {
    const fases = parseAnalisisFases(text)
    const container = $('analisis-fases')

    container.innerHTML = fases.map((fase, i) => `
      <div class="alp-fase">
        <button class="alp-fase__header" onclick="this.parentElement.classList.toggle('alp-fase--open')">
          <span class="alp-fase__num">${i + 1}</span>
          <span class="alp-fase__titulo">${fase.titulo}</span>
          <svg class="alp-fase__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <div class="alp-fase__body">
          <div class="alp-fase__content">${formatContent(fase.contenido)}</div>
        </div>
      </div>
    `).join('')

    $('analisis-resultado').classList.remove('hidden')

    // Expande la primera fase por defecto
    const primera = container.querySelector('.alp-fase')
    if (primera) primera.classList.add('alp-fase--open')

    // Guarda el texto completo en el botón de copia
    $('btn-copiar-analisis').dataset.text = text
  }

  function parseAnalisisFases(text) {
    const fasePatterns = [
      /\*\*FASE\s*1[^*]*\*\*/i,
      /\*\*FASE\s*2[^*]*\*\*/i,
      /\*\*FASE\s*3[^*]*\*\*/i,
      /\*\*FASE\s*4[^*]*\*\*/i,
      /\*\*FASE\s*5[^*]*\*\*/i,
    ]

    const fases = []
    let remaining = text

    for (let i = 0; i < fasePatterns.length; i++) {
      const match = remaining.match(fasePatterns[i])
      if (!match) continue

      const start = remaining.indexOf(match[0])
      const titulo = match[0].replace(/\*\*/g, '').trim()

      const nextMatch = i < fasePatterns.length - 1 ? remaining.slice(start + match[0].length).match(fasePatterns[i + 1]) : null
      const end = nextMatch
        ? start + match[0].length + remaining.slice(start + match[0].length).indexOf(nextMatch[0])
        : remaining.length

      const contenido = remaining.slice(start + match[0].length, end).trim()
      fases.push({ titulo, contenido })
    }

    // Si no se parsearon fases, devuelve todo como una sola
    if (fases.length === 0) {
      return [{ titulo: 'Análisis completo', contenido: text }]
    }

    return fases
  }

  function formatContent(text) {
    return text
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)+/gs, (m) => `<ul>${m}</ul>`)
      .replace(/\n\n/g, '</p><p>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
      .replace(/<p><\/p>/g, '')
  }

  function copyAnalysis() {
    const text = $('btn-copiar-analisis').dataset.text || ''
    navigator.clipboard.writeText(text).then(() => {
      $('btn-copiar-analisis').textContent = '✓ Copiado'
      setTimeout(() => ($('btn-copiar-analisis').textContent = 'Copiar'), 2000)
    })
  }

  // ── Documentos / PDFs ─────────────────────────────────────

  function setupDocumentosListeners() {
    $('btn-select-priority').addEventListener('click', selectPriorityDocs)
    $('btn-descargar-sel').addEventListener('click', downloadSelected)
  }

  function renderDocumentos(actuaciones) {
    if (!actuaciones || actuaciones.length === 0) {
      $('docs-empty').classList.remove('hidden')
      $('docs-lista').classList.add('hidden')
      return
    }

    const conPdf = actuaciones.filter((a) => a.tienePdf)
    if (conPdf.length === 0) {
      $('docs-empty').classList.remove('hidden')
      $('docs-empty').querySelector('p').textContent = `${actuaciones.length} actuaciones encontradas, pero ninguna tiene PDF disponible.`
      $('docs-lista').classList.add('hidden')
      return
    }

    $('docs-empty').classList.add('hidden')
    $('docs-lista').classList.remove('hidden')
    $('docs-count').textContent = `${conPdf.length} documentos con PDF disponible`

    const PRIORITY_TYPES = ['detención', 'aprehensión', 'indagatoria', 'procesamiento', 'sentencia', 'pericia', 'allanamiento', 'secuestro']

    $('docs-items').innerHTML = conPdf.map((doc, i) => {
      const isPriority = PRIORITY_TYPES.some((p) => (doc.tipo || '').toLowerCase().includes(p))
      return `
        <label class="alp-doc-item ${isPriority ? 'alp-doc-item--priority' : ''}">
          <input type="checkbox" class="alp-doc-check" data-index="${i}" data-url="${doc.urlPdf || ''}" ${isPriority ? 'checked' : ''} />
          <div class="alp-doc-info">
            <span class="alp-doc-tipo">${doc.tipo || 'Documento'}</span>
            <span class="alp-doc-fecha">${doc.fecha || 'Fecha no disponible'}</span>
            ${doc.autor ? `<span class="alp-doc-autor">${doc.autor}</span>` : ''}
          </div>
          ${isPriority ? '<span class="alp-doc-badge">Prioritario</span>' : ''}
        </label>
      `
    }).join('')
  }

  function selectPriorityDocs() {
    const PRIORITY_TYPES = ['detención', 'aprehensión', 'indagatoria', 'procesamiento', 'sentencia', 'pericia', 'allanamiento', 'secuestro']
    document.querySelectorAll('.alp-doc-check').forEach((cb) => {
      const tipo = cb.closest('.alp-doc-item')?.querySelector('.alp-doc-tipo')?.textContent?.toLowerCase() || ''
      cb.checked = PRIORITY_TYPES.some((p) => tipo.includes(p))
    })
  }

  function downloadSelected() {
    const selected = document.querySelectorAll('.alp-doc-check:checked')
    if (selected.length === 0) return

    selected.forEach((cb) => {
      const url = cb.dataset.url
      if (!url) return
      const tipo = cb.closest('.alp-doc-item')?.querySelector('.alp-doc-tipo')?.textContent || 'documento'
      const fecha = cb.closest('.alp-doc-item')?.querySelector('.alp-doc-fecha')?.textContent || ''
      const filename = `${fecha}_${tipo}`.replace(/[^a-zA-Z0-9\-_]/g, '_').replace(/_+/g, '_') + '.pdf'
      chrome.downloads?.download({ url, filename }) || window.open(url, '_blank')
    })
  }

  // ── Historial ─────────────────────────────────────────────

  async function loadHistorial() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['alpHistorial'], (result) => {
        state.historial = result.alpHistorial || []
        resolve()
      })
    })
  }

  function guardarEnHistorial(mevData, analisis) {
    const entry = {
      id: Date.now(),
      fecha: new Date().toLocaleString('es-AR'),
      caratula: mevData.caratula?.caratula || 'Sin carátula',
      expediente: mevData.caratula?.numeroExpediente || '',
      url: mevData.url,
      analisis,
    }
    state.historial.unshift(entry)
    if (state.historial.length > 20) state.historial = state.historial.slice(0, 20)
    chrome.storage.local.set({ alpHistorial: state.historial })
    renderHistorial()
  }

  function renderHistorial() {
    const lista = $('historial-lista')
    const empty = $('historial-empty')

    if (state.historial.length === 0) {
      empty.classList.remove('hidden')
      lista.innerHTML = ''
      return
    }

    empty.classList.add('hidden')
    lista.innerHTML = state.historial.map((entry) => `
      <div class="alp-historial-item" data-id="${entry.id}">
        <div class="alp-historial-item__header">
          <span class="alp-historial-item__caratula">${entry.caratula}</span>
          <button class="alp-btn alp-btn--icon alp-btn--xs alp-historial-item__del" data-id="${entry.id}" title="Eliminar">×</button>
        </div>
        <div class="alp-historial-item__meta">
          ${entry.expediente ? `<span>${entry.expediente}</span> · ` : ''}<span>${entry.fecha}</span>
        </div>
        <button class="alp-btn alp-btn--ghost alp-btn--xs alp-historial-item__ver" data-id="${entry.id}">Ver análisis</button>
      </div>
    `).join('')

    lista.querySelectorAll('.alp-historial-item__ver').forEach((btn) => {
      btn.addEventListener('click', () => {
        const entry = state.historial.find((e) => e.id === Number(btn.dataset.id))
        if (!entry) return
        renderAnalisis(entry.analisis)
        switchTab('analisis')
      })
    })

    lista.querySelectorAll('.alp-historial-item__del').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        state.historial = state.historial.filter((e) => e.id !== Number(btn.dataset.id))
        chrome.storage.local.set({ alpHistorial: state.historial })
        renderHistorial()
      })
    })
  }

  function setupHistorialListeners() {
    $('btn-limpiar-historial').addEventListener('click', () => {
      if (!confirm('¿Eliminar todo el historial?')) return
      state.historial = []
      chrome.storage.local.set({ alpHistorial: [] })
      renderHistorial()
    })
  }

  // ── Tabs ──────────────────────────────────────────────────

  function setupTabs() {
    document.querySelectorAll('.alp-tab').forEach((tab) => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab))
    })
  }

  function switchTab(tabId) {
    document.querySelectorAll('.alp-tab').forEach((t) => {
      t.classList.toggle('alp-tab--active', t.dataset.tab === tabId)
    })
    document.querySelectorAll('.alp-panel').forEach((p) => {
      p.classList.toggle('hidden', p.id !== `tab-${tabId}`)
      p.classList.toggle('alp-panel--active', p.id === `tab-${tabId}`)
    })
  }

  // ── Helpers UI ────────────────────────────────────────────

  function showError(msg) {
    $('analisis-error').classList.remove('hidden')
    $('error-msg').textContent = msg
  }

  function hideError() {
    $('analisis-error').classList.add('hidden')
  }

  function setLoadingMsg(msg) {
    $('loading-msg').textContent = msg
  }

  // ── Escucha mensajes del background ───────────────────────

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'MEV_DATA_READY') {
      handleMevData(message.data)
    }
    if (message.type === 'TAB_CHANGED') {
      updateMevStatus({ isMev: message.isMev, isCausa: false, url: message.url })
      if (message.isMev) {
        // Pide extracción en la nueva pestaña
        setTimeout(requestExtraction, 800)
      }
    }
  })

  // Intenta recuperar datos de session storage (por si el side panel se abrió después)
  chrome.storage.session.get(['mevData'], (result) => {
    if (result.mevData) handleMevData(result.mevData)
  })

  // ── Arranque ──────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', init)
  if (document.readyState !== 'loading') init()
})()
