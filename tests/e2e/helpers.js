/**
 * Helpers compartidos para los tests e2e de Alcance Legal Penal.
 *
 * El flujo de la app tiene dos blockers antes de llegar a cualquier ruta:
 *   1. DisclaimerAcceptance — pantalla bloqueante que requiere scroll + checkbox
 *   2. RequireAuth          — redirige a /login si no hay sesión (con Supabase activo)
 *
 * En modo test (.env.test):
 *   - Supabase está deshabilitado → auth bypass automático
 *   - VITE_USE_MOCKS=true → API retorna mocks
 *   - Disclaimer se bypasea inyectando localStorage antes del page.goto()
 */

/**
 * Inyecta la aceptación del disclaimer en localStorage antes de cargar la página.
 * Debe llamarse ANTES de page.goto().
 * Usa page.addInitScript() que corre antes del JS de la app.
 */
export async function bypassDisclaimer(page) {
    await page.addInitScript(() => {
        localStorage.setItem(
            'alcance_legal_disclaimer_accepted',
            JSON.stringify({ version: '1.1', timestamp: new Date().toISOString() })
        )
        // Also bypass the HeroScreen (shown on mobile once per session)
        sessionStorage.setItem('alcance_hero_shown', 'true')
    })
}

/**
 * Navega a una URL con disclaimer ya aceptado.
 * Combinación de bypassDisclaimer + goto + waitForLoadState.
 */
export async function gotoApp(page, path = '/') {
    await bypassDisclaimer(page)
    await page.goto(path)
    await page.waitForLoadState('networkidle')
}

/**
 * Textos de referencia extraídos del código fuente real.
 * Si el texto del DOM cambia, actualizar aquí.
 */
export const TEXTOS = {
    dashboard: {
        titulo: 'Consola de Criterio Jurídico',
        cardAnalizar: 'Analizar Causa Penal',
        cardAuditar: 'Auditar Estrategia',
        cardRedactar: 'Redactar Escrito de Defensa',
    },
    analizar: {
        titulo: 'Nueva Consulta Penal',
        botonSubmit: 'Iniciar análisis penal',
        errorHechos: 'Necesito al menos una descripción',
    },
    auditar: {
        titulo: 'Auditar Estrategia Procesal',
        botonSubmit: 'Solicitar Auditoría',
    },
    redactar: {
        titulo: 'Redactar Escrito de Defensa',
        botonSubmit: 'Generar Borrador',
    },
    resultado: {
        paso1Badge: 'ANÁLISIS PRELIMINAR',
        paso2Btn: 'El encuadre es correcto — Ver Estrategia Defensiva',
        pdfBtn: 'Descargar Informe PDF',
        botonNuevaConsulta: 'Nueva Consulta',
    },
    disclaimer: {
        titulo: 'AVISO LEGAL OBLIGATORIO',
        checkboxLabel: 'Leí el aviso legal',
        botonIngresar: 'Ingresar al sistema',
    },
}
