// ============================================================
// sidepanel.js — Lógica del panel lateral
// Alcance Legal Penal · MEV Navigator
// ============================================================

;(function () {
  'use strict'

  // ── Constantes Supabase ───────────────────────────────────
  const SUPABASE_URL = 'https://nclpzmyjjmglpjalmrri.supabase.co'
  const SUPABASE_ANON_KEY = [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jbHB6bXlqam1nbHBqYWxtcnJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMzI1MzQsImV4cCI6MjA5ODgwODUzNH0',
    'HwbC0QzX2I6zusmB7OOG6ayKKv7JTy2nGsk0GnhSaxk'
  ].join('.')

  // ── Estado ───────────────────────────────────────────────

  let state = {
    isMev: false,
    isCausa: false,
    mevData: null,
    config: {
      autoAnalizar: false,
    },
    session: null, // access_token, email, user_id
    historial: [],
    analysisInProgress: false,
  }

  // ── DOM refs ──────────────────────────────────────────────

  const $ = (id) => document.getElementById(id)
  const statusDot = $('status-dot')
  const statusText = $('status-text')

  // ── Inicialización ────────────────────────────────────────

  async function init() {
    await loadConfigAndSession()
    await loadHistorial()
    setupTabs()
    setupAuthListeners()
    setupConfigListeners()
    setupAnalisisListeners()
    setupDocumentosListeners()
    setupHistorialListeners()
    checkTabStatus()
    renderHistorial()
  }

  // ── Config y Sesión ───────────────────────────────────────

  async function loadConfigAndSession() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['alpConfig', 'alpSession'], (result) => {
        if (result.alpConfig) {
          state.config = { ...state.config, ...result.alpConfig }
        }
        if (result.alpSession) {
          state.session = result.alpSession
        }
        applyConfigToUI()
        applySessionToUI()
        resolve()
      })
    })
  }

  function applyConfigToUI() {
    const toggle = $('toggle-auto-analizar')
    if (toggle) toggle.checked = state.config.autoAnalizar || false
  }

  function applySessionToUI() {
    const secLogin = $('section-login')
    const secAuth = $('section-authenticated')
    const displayEmail = $('user-email-display')

    if (state.session && state.session.access_token) {
      if (secLogin) secLogin.classList.add('hidden')
      if (secAuth) secAuth.classList.remove('hidden')
      if (displayEmail) displayEmail.textContent = state.session.email || 'Conectado'
    } else {
      if (secLogin) secLogin.classList.remove('hidden')
      if (secAuth) secAuth.classList.add('hidden')
    }
  }

  function saveConfig() {
    const autoAnalizar = $('toggle-auto-analizar').checked
    state.config = { autoAnalizar }
    chrome.storage.local.set({ alpConfig: state.config }, () => {
      const saved = $('config-saved')
      if (saved) {
        saved.classList.remove('hidden')
        setTimeout(() => saved.classList.add('hidden'), 2000)
      }
    })
  }

  // ── Autenticación Supabase ────────────────────────────────

  function setupAuthListeners() {
    const btnLogin = $('btn-login')
    const btnLogout = $('btn-logout')

    if (btnLogin) {
      btnLogin.addEventListener('click', handleLogin)
    }
    if (btnLogout) {
      btnLogout.addEventListener('click', handleLogout)
    }

    // Permitir login presionando Enter
    const passwordInput = $('login-password')
    if (passwordInput) {
      passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin()
      })
    }
  }

  async function handleLogin() {
    const email = $('login-email').value.trim()
    const password = $('login-password').value

    const errorContainer = $('login-error')
    const errorMsg = $('login-error-msg')
    const btnLogin = $('btn-login')

    if (errorContainer) errorContainer.classList.add('hidden')

    if (!email || !password) {
      showLoginError('Ingresá correo electrónico y contraseña.')
      return
    }

    btnLogin.disabled = true
    btnLogin.textContent = 'Ingresando...'

    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        const msg = errData.error_description || errData.error?.message || 'Error al iniciar sesión'
        throw new Error(msg === 'Invalid login credentials' ? 'Credenciales de acceso inválidas.' : msg)
      }

      const data = await response.json()
      
      state.session = {
        access_token: data.access_token,
        email: data.user?.email || email,
        user_id: data.user?.id
      }

      chrome.storage.local.set({ alpSession: state.session }, () => {
        applySessionToUI()
        // Limpiar campos
        $('login-email').value = ''
        $('login-password').value = ''
      })

    } catch (err) {
      showLoginError(err.message)
    } finally {
      btnLogin.disabled = false
      btnLogin.textContent = 'Ingresar'
    }
  }

  function handleLogout() {
    // Intenta notificar al backend de Supabase (fire and forget)
    if (state.session && state.session.access_token) {
      fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${state.session.access_token}`
        }
      }).catch(() => {})
    }

    state.session = null
    chrome.storage.local.remove(['alpSession'], () => {
      applySessionToUI()
    })
  }

  function showLoginError(msg) {
    const errorContainer = $('login-error')
    const errorMsg = $('login-error-msg')
    if (errorContainer && errorMsg) {
      errorContainer.classList.remove('hidden')
      errorMsg.textContent = msg
    }
  }

  function setupConfigListeners() {
    const btnGuardar = $('btn-guardar-config')
    if (btnGuardar) {
      btnGuardar.addEventListener('click', saveConfig)
    }
    const btnConfig = $('btn-config')
    if (btnConfig) {
      btnConfig.addEventListener('click', () => switchTab('config'))
    }
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

  // P7: Banner de sesión expirada
  function showSessionExpiredBanner() {
    let banner = $('mev-session-expired')
    if (!banner) {
      banner = document.createElement('div')
      banner.id = 'mev-session-expired'
      banner.style.cssText = 'background:#fff3cd;border:1px solid #ffc107;border-radius:6px;padding:10px 12px;margin:8px 0;font-size:12px;display:flex;flex-direction:column;gap:6px;'
      banner.innerHTML = `
        <strong style="color:#856404">⚠️ Sesión del MEV expirada</strong>
        <span style="color:#664d03">El MEV redirigió al login. Iniciá sesión nuevamente en la pestaña del MEV.</span>
        <button id="btn-reabrir-mev" style="align-self:flex-start;padding:4px 10px;background:#ffc107;border:none;border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;">Ir al MEV →</button>
      `
      const container = document.querySelector('.alp-main') || document.body
      container.prepend(banner)

      document.getElementById('btn-reabrir-mev').addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://mev.scba.gov.ar' })
      })
    }
    banner.style.display = 'flex'
  }

  function hideSessionExpiredBanner() {
    const banner = $('mev-session-expired')
    if (banner) banner.style.display = 'none'
  }

  function handleMevData(data) {
    if (!data || data.error) {
      setStatus('error', data?.error || 'Error al leer el MEV')
      showSection('mev-sin-causa')
      return
    }

    if (data.pageType === 'login') {
      setStatus('warning', 'Sesión del MEV expirada')
      showSessionExpiredBanner()
      showSection('mev-sin-causa')
      return
    }

    hideSessionExpiredBanner()

    if (data.pageType === 'causa') {
      state.mevData = data
      setStatus('connected', `Causa detectada · ${data.actuaciones?.length || 0} actuaciones`)
      showSection('causa-detectada')
      renderCaratulaPreview(data.caratula)
      renderDocumentos(data.actuaciones)

      if (state.config.autoAnalizar && state.session && state.session.access_token) {
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
    const btnAnalizar = $('btn-analizar')
    if (btnAnalizar) {
      btnAnalizar.addEventListener('click', runAnalysis)
    }
    const btnReextraer = $('btn-reextraer')
    if (btnReextraer) {
      btnReextraer.addEventListener('click', requestExtraction)
    }
    const btnCopiar = $('btn-copiar-analisis')
    if (btnCopiar) {
      btnCopiar.addEventListener('click', copyAnalysis)
    }
  }

  async function runAnalysis() {
    if (state.analysisInProgress) return
    if (!state.session || !state.session.access_token) {
      showError('Debés iniciar sesión en la pestaña Config antes de analizar.')
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
    setLoadingMsg('Preparando datos del expediente...')

    try {
      const c = state.mevData.caratula || {}
      const acts = state.mevData.actuaciones || []

      // Hechos para admisibilidad (mínimo 20 caracteres)
      const hechos = `Causa penal: "${c.caratula || 'Sin carátula'}" (Expediente Nro: ${c.numeroExpediente || 'No especificado'}). Imputado/a: ${c.imputado || 'No especificado'}. Delito investigado: ${c.delito || 'No especificado'}. Etapa: ${c.etapaProcesal || 'IPP'}. Cautelar: ${c.cautelar || 'No especificada'}.`

      // Actuaciones estructuradas en texto plano
      const documentacion_caso = acts.slice(0, 35).map((a, i) =>
        `Actuación ${i + 1}: [${a.fecha || 'Sin fecha'}] - Tipo: ${a.tipo || 'N/A'} - Autor: ${a.autor || 'N/A'}${a.descripcion ? ` - Detalle: ${a.descripcion}` : ''}`
      ).join('\n')

      const apiData = {
        hechos,
        documentacion_caso,
        tipo_penal: c.delito || 'No especificado',
        etapa_procesal: c.etapaProcesal || 'IPP',
        prueba_acusacion: acts.filter(a => a.tienePdf).map(a => a.tipo).slice(0, 5).join(', ') || 'Actuaciones del expediente'
      }

      setLoadingMsg('Analizando expediente con IA en el backend (hasta 45s)...')
      const { textResult, rawRes } = await callEdgeFunction(apiData)
      renderAnalisis(textResult)
      guardarEnHistorial(state.mevData, textResult)
      guardarEnSupabase(rawRes, hechos, c)
    } catch (err) {
      showError(`Error en el análisis: ${err.message}`)
    } finally {
      state.analysisInProgress = false
      $('analisis-loading').classList.add('hidden')
    }
  }

  async function callEdgeFunction(apiData) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/analizar-caso`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.session.access_token}`
      },
      body: JSON.stringify(apiData)
    })

    if (!response.ok) {
      const errText = await response.text()
      let errMsg = `Error ${response.status} del servidor`
      try {
        const parsedErr = JSON.parse(errText)
        errMsg = parsedErr.fundamento || parsedErr.error?.message || errMsg
      } catch {}
      throw new Error(errMsg)
    }

    const res = await response.json()
    if (!res.success) {
      throw new Error(res.fundamento || 'El análisis fue rechazado por el sistema.')
    }

    const data = res.data || {}

    // Reconstruye el texto plano con marcas **FASE X** para compatibilidad con parseAnalisisFases
    const textResult =
      `**FASE 1 — Encuadre procesal**\n${data.encuadre_procesal || 'No disponible.'}\n\n` +
      `**FASE 2 — Análisis de prueba de cargo**\n${data.analisis_prueba_cargo || 'No disponible.'}\n\n` +
      `**FASE 3 — Nulidades y vicios procesales**\n${data.nulidades_y_vicios || 'No disponible.'}\n\n` +
      `**FASE 4 — Contraargumentación defensiva**\n${data.contraargumentacion || 'No disponible.'}\n\n` +
      `**FASE 5 — Recomendación estratégica**\n${data.conclusion_defensiva || 'No disponible.'}\n\n` +
      `**Limitaciones**\n${data.limitaciones || 'No disponible.'}`

    return { textResult, rawRes: res }
  }

  async function guardarEnSupabase(rawRes, hechos, caratula) {
    if (!state.session?.access_token || !state.session?.user_id) return
    try {
      const payload = {
        user_id: state.session.user_id,
        numero_informe: rawRes.data?.numero_informe,
        fecha_emision: rawRes.data?.fecha_emision || new Date().toISOString(),
        status: rawRes.status,
        tipo_analisis: 'analizar',
        hechos,
        tipo_penal: caratula.delito || null,
        etapa_procesal: caratula.etapaProcesal || 'IPP',
        resultado_json: rawRes.data,
        criterios_utilizados: rawRes.meta?.criterios_utilizados ?? null,
        pipeline_version: rawRes.meta?.pipeline_version ?? null,
      }
      const res = await fetch(`${SUPABASE_URL}/rest/v1/analisis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${state.session.access_token}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(payload),
      })
      if (res.ok) mostrarBotonWebApp()
    } catch (err) {
      console.error('[MEV] Error guardando en Supabase:', err)
    }
  }

  function mostrarBotonWebApp() {
    let btn = $('btn-ver-web')
    if (!btn) {
      btn = document.createElement('a')
      btn.id = 'btn-ver-web'
      btn.href = 'https://alcance-legal-penal.vercel.app/historial'
      btn.target = '_blank'
      btn.rel = 'noreferrer'
      btn.style.cssText = [
        'display:flex;align-items:center;justify-content:center;gap:6px',
        'margin:12px 0 4px',
        'padding:10px 16px',
        'background:#1d4ed8',
        'color:#fff',
        'border-radius:6px',
        'text-decoration:none',
        'font-size:13px',
        'font-weight:600',
        'letter-spacing:0.02em',
      ].join(';')
      btn.innerHTML = '📋 Ver análisis en Alcance Legal Penal →'
      const container = $('analisis-resultado')
      if (container) container.before(btn)
    }
    btn.style.display = 'flex'
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
