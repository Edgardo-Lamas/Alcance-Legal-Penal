/**
 * FLUJO 5 — Redactar Escrito (con VITE_USE_MOCKS=true)
 */
import { test, expect } from '@playwright/test'
import { gotoApp, TEXTOS } from './helpers.js'

const HECHOS_VALIDOS =
    'El día 15 de enero de 2026, el imputado fue detenido en la vía pública sin orden judicial ' +
    'previa y sin que mediara flagrancia. Los agentes policiales procedieron al secuestro de ' +
    'elementos de su mochila sin ningún tipo de respaldo documental ni testigo presente. ' +
    'La cadena de custodia del material secuestrado presenta irregularidades graves que comprometen ' +
    'su valor probatorio. No existen testigos del procedimiento ni cámara que lo respalde.'

test.describe('Redactar Escrito', () => {

    test('formulario de redacción carga correctamente', async ({ page }) => {
        await gotoApp(page, '/redactar')
        await expect(page.getByText(TEXTOS.redactar.titulo)).toBeVisible()
        await expect(page.locator('#hechos_relevantes')).toBeVisible()
        await expect(page.locator('#pretension')).toBeVisible()
    })

    test('muestra aviso "BORRADOR ASISTIDO" en el formulario', async ({ page }) => {
        await gotoApp(page, '/redactar')
        await expect(page.getByText('BORRADOR ASISTIDO', { exact: true })).toBeVisible()
    })

    test('submit sin tipo de escrito muestra error', async ({ page }) => {
        await gotoApp(page, '/redactar')

        await page.fill('#hechos_relevantes', HECHOS_VALIDOS)
        await page.fill('#pretension', 'Nulidad del procedimiento')
        await page.getByRole('button', { name: TEXTOS.redactar.botonSubmit }).click()

        await expect(page.locator('.form-error')).toBeVisible()
        await expect(page.locator('.form-error').first()).toContainText('Seleccione el tipo de escrito')
    })

    test('submit sin hechos (menor a 200 chars) muestra error', async ({ page }) => {
        await gotoApp(page, '/redactar')

        await page.locator('label.form-option', { hasText: 'Expresión de Agravios' }).first().click()
        await page.fill('#pretension', 'Sobreseimiento')
        // hechos_relevantes vacío
        await page.getByRole('button', { name: TEXTOS.redactar.botonSubmit }).click()

        await expect(page.locator('.form-error')).toBeVisible()
        await expect(page.locator('.form-error').first()).toContainText('mínimo 200 caracteres')
    })

    test('submit válido navega a /resultado con tipo redactar', async ({ page }) => {
        await gotoApp(page, '/redactar')

        await page.locator('label.form-option', { hasText: 'Expresión de Agravios' }).first().click()
        await page.fill('#hechos_relevantes', HECHOS_VALIDOS)
        await page.fill('#pretension', 'Se declare la nulidad del procedimiento policial')

        await page.getByRole('button', { name: TEXTOS.redactar.botonSubmit }).click()
        await page.waitForURL('**/resultado**', { timeout: 10_000 })

        expect(page.url()).toContain('/resultado')
    })

    test('resultado redactar muestra badge BORRADOR ASISTIDO', async ({ page }) => {
        await gotoApp(page, '/redactar')
        await page.locator('label.form-option', { hasText: 'Expresión de Agravios' }).first().click()
        await page.fill('#hechos_relevantes', HECHOS_VALIDOS)
        await page.fill('#pretension', 'Sobreseimiento')
        await page.getByRole('button', { name: TEXTOS.redactar.botonSubmit }).click()
        await page.waitForURL('**/resultado**', { timeout: 10_000 })
        await page.waitForLoadState('networkidle')

        await expect(page.getByText('BORRADOR ASISTIDO', { exact: true })).toBeVisible()
    })

    test('resultado redactar muestra sección "Borrador del Escrito"', async ({ page }) => {
        await gotoApp(page, '/redactar')
        await page.locator('label.form-option', { hasText: 'Expresión de Agravios' }).first().click()
        await page.fill('#hechos_relevantes', HECHOS_VALIDOS)
        await page.fill('#pretension', 'Sobreseimiento')
        await page.getByRole('button', { name: TEXTOS.redactar.botonSubmit }).click()
        await page.waitForURL('**/resultado**', { timeout: 10_000 })
        await page.waitForLoadState('networkidle')

        await expect(page.getByText('Borrador del Escrito')).toBeVisible()
    })

    test('resultado redactar muestra botón PDF', async ({ page }) => {
        await gotoApp(page, '/redactar')
        await page.locator('label.form-option', { hasText: 'Expresión de Agravios' }).first().click()
        await page.fill('#hechos_relevantes', HECHOS_VALIDOS)
        await page.fill('#pretension', 'Sobreseimiento')
        await page.getByRole('button', { name: TEXTOS.redactar.botonSubmit }).click()
        await page.waitForURL('**/resultado**', { timeout: 10_000 })
        await page.waitForLoadState('networkidle')

        await expect(page.locator('.btn--pdf')).toBeVisible()
    })

    test('resultado redactar contiene contenido del borrador', async ({ page }) => {
        await gotoApp(page, '/redactar')
        await page.locator('label.form-option', { hasText: 'Expresión de Agravios' }).first().click()
        await page.fill('#hechos_relevantes', HECHOS_VALIDOS)
        await page.fill('#pretension', 'Sobreseimiento')
        await page.getByRole('button', { name: TEXTOS.redactar.botonSubmit }).click()
        await page.waitForURL('**/resultado**', { timeout: 10_000 })
        await page.waitForLoadState('networkidle')

        // El mock de redactar incluye "Sr. Juez:"
        await expect(page.getByText('Sr. Juez')).toBeVisible()
    })
})
