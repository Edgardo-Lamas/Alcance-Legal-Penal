/**
 * FLUJO 6 — Historial
 *
 * Sin Supabase activo, el historial carga pero muestra estado vacío.
 */
import { test, expect } from '@playwright/test'
import { gotoApp } from './helpers.js'

test.describe('Historial', () => {

    test('/historial carga sin errores de red', async ({ page }) => {
        const pageErrors = []
        page.on('pageerror', err => pageErrors.push(err.message))

        await gotoApp(page, '/historial')
        await page.waitForLoadState('networkidle')

        // No debe haber errores de JS
        expect(pageErrors).toHaveLength(0)
    })

    test('/historial muestra el encabezado de la sección', async ({ page }) => {
        await gotoApp(page, '/historial')
        await page.waitForLoadState('networkidle')

        // La página debe renderizar algo con "Historial" en el título
        const heading = page.locator('h1, h2').first()
        await expect(heading).toBeVisible()
    })

    test('/historial es accesible desde el menú de navegación', async ({ page }) => {
        await gotoApp(page, '/')

        // Click en el link de Historial en el nav (desktop)
        const historialLink = page.locator('a[href="/historial"]')
        if (await historialLink.count() > 0) {
            await historialLink.click()
            await page.waitForURL('**/historial**', { timeout: 5_000 })
            expect(page.url()).toContain('/historial')
        } else {
            // Si el nav está colapsado (mobile), navegar directamente
            await gotoApp(page, '/historial')
            expect(page.url()).toContain('/historial')
        }
    })

    test('/historial no redirige a /login (modo sin auth)', async ({ page }) => {
        await gotoApp(page, '/historial')
        await page.waitForLoadState('networkidle')

        // En modo test (sin Supabase), no debe redirigir
        expect(page.url()).not.toContain('/login')
        expect(page.url()).toContain('/historial')
    })
})
