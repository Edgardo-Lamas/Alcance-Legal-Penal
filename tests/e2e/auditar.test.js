/**
 * FLUJO 4 — Auditar Estrategia (con VITE_USE_MOCKS=true)
 */
import { test, expect } from '@playwright/test'
import { gotoApp, TEXTOS } from './helpers.js'

const ESTRATEGIA_VALIDA =
    'La estrategia defensiva se basa en la insuficiencia de la prueba testimonial de la denunciante, ' +
    'quien presenta contradicciones en las tres versiones rendidas. Se solicitará pericia psicológica ' +
    'para evaluar la credibilidad del testimonio y se plantearán nulidades del allanamiento por falta ' +
    'de orden judicial previa. La línea argumental principal es la regla de exclusión de prueba ilícita ' +
    'y la aplicación del in dubio pro reo ante la ausencia de corroboración periférica objetiva.'

// Completa el formulario de auditoría con datos válidos:
// etapa procesal + situación del imputado + estrategia (>150 chars) + objetivo defensivo.
async function completarAuditoriaValida(page) {
    await page.locator('label.form-option', { hasText: 'Juicio Oral' }).first().click()
    await page.locator('label.form-option', { hasText: 'En libertad' }).first().click()
    await page.fill('#estrategia_actual', ESTRATEGIA_VALIDA)
    await page.fill('#objetivo_defensivo', 'Obtener sobreseimiento por insuficiencia probatoria')
}

test.describe('Auditar Estrategia', () => {

    test('formulario de auditoría carga correctamente', async ({ page }) => {
        await gotoApp(page, '/auditar')
        await expect(page.getByText(TEXTOS.auditar.titulo)).toBeVisible()
        await expect(page.locator('#estrategia_actual')).toBeVisible()
        await expect(page.locator('#objetivo_defensivo')).toBeVisible()
    })

    test('submit sin etapa procesal muestra error', async ({ page }) => {
        await gotoApp(page, '/auditar')

        // Todo completo menos la etapa → único error: la etapa.
        await page.locator('label.form-option', { hasText: 'En libertad' }).first().click()
        await page.fill('#estrategia_actual', ESTRATEGIA_VALIDA)
        await page.fill('#objetivo_defensivo', 'Obtener sobreseimiento')
        await page.getByRole('button', { name: TEXTOS.auditar.botonSubmit }).click()

        await expect(page.locator('.form-error').first()).toBeVisible()
        await expect(page.locator('.form-error').first()).toContainText('Seleccione la etapa procesal')
    })

    test('submit sin estrategia (menor a 150 chars) muestra error', async ({ page }) => {
        await gotoApp(page, '/auditar')

        // Etapa + situación OK, estrategia vacía → único error: la estrategia.
        await page.locator('label.form-option', { hasText: 'Juicio Oral' }).first().click()
        await page.locator('label.form-option', { hasText: 'En libertad' }).first().click()
        await page.fill('#objetivo_defensivo', 'Sobreseimiento')
        await page.getByRole('button', { name: TEXTOS.auditar.botonSubmit }).click()

        await expect(page.locator('.form-error')).toBeVisible()
        await expect(page.locator('.form-error').first()).toContainText('mínimo 150 caracteres')
    })

    test('submit válido navega a /resultado con tipo auditar', async ({ page }) => {
        await gotoApp(page, '/auditar')
        await completarAuditoriaValida(page)

        await page.getByRole('button', { name: TEXTOS.auditar.botonSubmit }).click()
        await page.waitForURL('**/resultado**', { timeout: 10_000 })

        expect(page.url()).toContain('/resultado')
    })

    test('resultado auditar muestra badge de dictamen', async ({ page }) => {
        await gotoApp(page, '/auditar')
        await completarAuditoriaValida(page)
        await page.getByRole('button', { name: TEXTOS.auditar.botonSubmit }).click()
        await page.waitForURL('**/resultado**', { timeout: 10_000 })
        await page.waitForLoadState('networkidle')

        await expect(page.getByText('DICTAMEN DE AUDITORÍA', { exact: true })).toBeVisible()
    })

    test('resultado auditar muestra sección de consistencia', async ({ page }) => {
        await gotoApp(page, '/auditar')
        await completarAuditoriaValida(page)
        await page.getByRole('button', { name: TEXTOS.auditar.botonSubmit }).click()
        await page.waitForURL('**/resultado**', { timeout: 10_000 })
        await page.waitForLoadState('networkidle')

        await expect(page.getByText('Evaluación de Consistencia Estratégica')).toBeVisible()
        await expect(page.getByText('Observaciones Críticas')).toBeVisible()
    })

    test('resultado auditar muestra botón PDF', async ({ page }) => {
        await gotoApp(page, '/auditar')
        await completarAuditoriaValida(page)
        await page.getByRole('button', { name: TEXTOS.auditar.botonSubmit }).click()
        await page.waitForURL('**/resultado**', { timeout: 10_000 })
        await page.waitForLoadState('networkidle')

        // Para auditar, el PDF button aparece directamente (no hay paso 1/2)
        await expect(page.locator('.btn--pdf')).toBeVisible()
    })
})
