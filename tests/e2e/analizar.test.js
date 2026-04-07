/**
 * FLUJO 3 — Analizar Caso (con VITE_USE_MOCKS=true)
 *
 * Pipeline completo: formulario → submit → /resultado → paso 1 → paso 2 → PDF.
 * El mock API tiene una animación mínima de ~4.6s antes de navegar.
 */
import { test, expect } from '@playwright/test'
import { gotoApp, TEXTOS } from './helpers.js'

// Texto de hechos que supera el mínimo de 20 caracteres
const HECHOS_VALIDOS =
    'Se imputa al defendido haber sustraído elementos del comercio ubicado en ' +
    'calle Mitre 450 de La Plata, el día 15 de marzo de 2026, sin que existan ' +
    'testigos presenciales y con prueba exclusivamente testimonial de la denunciante.'

test.describe('Analizar Caso', () => {

    test('dashboard carga y muestra las 3 capacidades', async ({ page }) => {
        await gotoApp(page, '/')
        await expect(page.getByRole('heading', { name: TEXTOS.dashboard.titulo })).toBeVisible()
        await expect(page.getByRole('heading', { name: TEXTOS.dashboard.cardAnalizar })).toBeVisible()
        await expect(page.getByRole('heading', { name: TEXTOS.dashboard.cardAuditar })).toBeVisible()
        await expect(page.getByRole('heading', { name: TEXTOS.dashboard.cardRedactar })).toBeVisible()
    })

    test('formulario analizar carga correctamente', async ({ page }) => {
        await gotoApp(page, '/analizar')
        await expect(page.getByText(TEXTOS.analizar.titulo)).toBeVisible()
        await expect(page.locator('#hechos')).toBeVisible()
        await expect(page.locator('.analizar__btn-submit')).toBeVisible()
    })

    test('submit con formulario vacío muestra error', async ({ page }) => {
        await gotoApp(page, '/analizar')

        await page.locator('.analizar__btn-submit').click()

        await expect(page.locator('.form-error')).toBeVisible()
        await expect(page.locator('.form-error')).toContainText(TEXTOS.analizar.errorHechos)
    })

    test('char-count en rojo con texto menor a 20 chars', async ({ page }) => {
        await gotoApp(page, '/analizar')

        await page.fill('#hechos', 'texto corto')

        const charCount = page.locator('.char-count')
        await expect(charCount).toHaveClass(/char-count--warning/)
    })

    test('char-count en verde con texto de 20 o más chars', async ({ page }) => {
        await gotoApp(page, '/analizar')

        await page.fill('#hechos', 'Este texto tiene veintidós chars')

        const charCount = page.locator('.char-count')
        await expect(charCount).toHaveClass(/char-count--ok/)
    })

    test('submit válido navega a /resultado con datos', async ({ page }) => {
        await gotoApp(page, '/analizar')

        await page.fill('#hechos', HECHOS_VALIDOS)
        await page.locator('.analizar__btn-submit').click()

        // Esperar la animación del pipeline y la navegación (máx ~6s)
        await page.waitForURL('**/resultado**', { timeout: 15_000 })
        expect(page.url()).toContain('/resultado')
    })

    test('Paso 1 — NO muestra botón PDF (solo Análisis Preliminar)', async ({ page }) => {
        await gotoApp(page, '/analizar')
        await page.fill('#hechos', HECHOS_VALIDOS)
        await page.locator('.analizar__btn-submit').click()
        await page.waitForURL('**/resultado**', { timeout: 15_000 })
        await page.waitForLoadState('networkidle')

        // Estamos en paso 1 → NO debe haber botón PDF (no está en el DOM)
        await expect(page.locator('.btn--pdf')).toHaveCount(0)

        // Sí debe verse el badge de Análisis Preliminar
        await expect(page.locator('.resultado__badge-preliminar')).toBeVisible()
    })

    test('Paso 2 — muestra botón "Descargar Informe PDF"', async ({ page }) => {
        await gotoApp(page, '/analizar')
        await page.fill('#hechos', HECHOS_VALIDOS)
        await page.locator('.analizar__btn-submit').click()
        await page.waitForURL('**/resultado**', { timeout: 15_000 })
        await page.waitForLoadState('networkidle')

        // Avanzar al paso 2
        await page.getByText(TEXTOS.resultado.paso2Btn).click()
        await page.waitForTimeout(500)

        // Ahora sí debe aparecer el botón PDF
        await expect(page.locator('.btn--pdf')).toBeVisible()
        await expect(page.locator('.btn--pdf')).toContainText('Descargar Informe PDF')
    })

    test('click en PDF — descarga sin errores de consola', async ({ page }) => {
        const consoleErrors = []
        page.on('console', msg => {
            if (msg.type() === 'error') consoleErrors.push(msg.text())
        })

        await gotoApp(page, '/analizar')
        await page.fill('#hechos', HECHOS_VALIDOS)
        await page.locator('.analizar__btn-submit').click()
        await page.waitForURL('**/resultado**', { timeout: 15_000 })
        await page.waitForLoadState('networkidle')

        await page.getByText(TEXTOS.resultado.paso2Btn).click()
        await page.waitForTimeout(500)

        // Preparar para capturar el download
        const [download] = await Promise.all([
            page.waitForEvent('download', { timeout: 10_000 }),
            page.locator('.btn--pdf').click(),
        ])

        expect(download.suggestedFilename()).toMatch(/\.pdf$/)

        // Verificar que no hubo errores de consola relacionados con el PDF
        const pdfErrors = consoleErrors.filter(e =>
            e.toLowerCase().includes('pdf') || e.toLowerCase().includes('jspdf')
        )
        expect(pdfErrors).toHaveLength(0)
    })

    test('resultado muestra encuadre procesal en paso 2', async ({ page }) => {
        await gotoApp(page, '/analizar')
        await page.fill('#hechos', HECHOS_VALIDOS)
        await page.locator('.analizar__btn-submit').click()
        await page.waitForURL('**/resultado**', { timeout: 15_000 })
        await page.waitForLoadState('networkidle')

        await page.getByText(TEXTOS.resultado.paso2Btn).click()
        await page.waitForTimeout(300)

        // Las secciones del análisis deben estar presentes
        await expect(page.getByText('Encuadre Procesal')).toBeVisible()
        await expect(page.getByText('Análisis de Prueba de Cargo')).toBeVisible()
    })

    test('botón Nueva Consulta vuelve al dashboard', async ({ page }) => {
        await gotoApp(page, '/analizar')
        await page.fill('#hechos', HECHOS_VALIDOS)
        await page.locator('.analizar__btn-submit').click()
        await page.waitForURL('**/resultado**', { timeout: 15_000 })

        await page.getByText(TEXTOS.resultado.botonNuevaConsulta).click()
        await page.waitForURL('**/', { timeout: 5_000 })
        await expect(page.getByText(TEXTOS.dashboard.titulo)).toBeVisible()
    })

    // ─── Tests del botón Word ──────────────────────────────────────────────────

    test('Paso 1 — NO muestra botón Word (solo Análisis Preliminar)', async ({ page }) => {
        await gotoApp(page, '/analizar')
        await page.fill('#hechos', HECHOS_VALIDOS)
        await page.locator('.analizar__btn-submit').click()
        await page.waitForURL('**/resultado**', { timeout: 15_000 })
        await page.waitForLoadState('networkidle')

        // En paso 1 el botón Word no debe estar en el DOM
        await expect(page.locator('.btn--word')).toHaveCount(0)
    })

    test('Paso 2 — muestra botón "Descargar en Word"', async ({ page }) => {
        await gotoApp(page, '/analizar')
        await page.fill('#hechos', HECHOS_VALIDOS)
        await page.locator('.analizar__btn-submit').click()
        await page.waitForURL('**/resultado**', { timeout: 15_000 })
        await page.waitForLoadState('networkidle')

        await page.getByText(TEXTOS.resultado.paso2Btn).click()
        await page.waitForTimeout(500)

        await expect(page.locator('.btn--word')).toBeVisible()
        await expect(page.locator('.btn--word')).toContainText('Descargar en Word')
    })

    test('click en Word — descarga .docx sin errores de consola', async ({ page }) => {
        const consoleErrors = []
        page.on('console', msg => {
            if (msg.type() === 'error') consoleErrors.push(msg.text())
        })

        await gotoApp(page, '/analizar')
        await page.fill('#hechos', HECHOS_VALIDOS)
        await page.locator('.analizar__btn-submit').click()
        await page.waitForURL('**/resultado**', { timeout: 15_000 })
        await page.waitForLoadState('networkidle')

        await page.getByText(TEXTOS.resultado.paso2Btn).click()
        await page.waitForTimeout(500)

        const [download] = await Promise.all([
            page.waitForEvent('download', { timeout: 15_000 }),
            page.locator('.btn--word').click(),
        ])

        expect(download.suggestedFilename()).toMatch(/\.docx$/)

        const wordErrors = consoleErrors.filter(e =>
            e.toLowerCase().includes('docx') || e.toLowerCase().includes('packer')
        )
        expect(wordErrors).toHaveLength(0)
    })

    test('botón Word NO visible sin datos reales', async ({ page }) => {
        // Navegar a /resultado sin state → capacidad undefined → muestra "No hay resultados"
        await gotoApp(page, '/resultado')
        await page.waitForLoadState('networkidle')

        // Sin datos de formulario el componente no renderiza los botones
        await expect(page.locator('.btn--word')).toHaveCount(0)
    })
})
