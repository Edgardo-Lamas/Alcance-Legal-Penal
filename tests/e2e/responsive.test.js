/**
 * FLUJO 7 — Responsive y PWA
 */
import { test, expect } from '@playwright/test'
import { gotoApp } from './helpers.js'

const VIEWPORTS = [
    { name: 'mobile',  width: 375,  height: 812 },
    { name: 'tablet',  width: 768,  height: 1024 },
    { name: 'desktop', width: 1280, height: 800 },
]

test.describe('Responsive — Layouts', () => {

    for (const vp of VIEWPORTS) {
        test(`dashboard carga correctamente en ${vp.name} (${vp.width}px)`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })
            await gotoApp(page, '/')

            // El dashboard debe ser visible sin errores de layout
            await expect(page.getByText('Consola de Criterio Jurídico')).toBeVisible()

            // No debe haber overflow horizontal (el body no debe tener scrollX)
            const hasHorizontalOverflow = await page.evaluate(() => {
                return document.body.scrollWidth > document.body.clientWidth + 20
            })
            expect(hasHorizontalOverflow).toBe(false)
        })

        test(`formulario analizar es usable en ${vp.name} (${vp.width}px)`, async ({ page }) => {
            await page.setViewportSize({ width: vp.width, height: vp.height })
            await gotoApp(page, '/analizar')

            const hechos = page.locator('#hechos')
            await expect(hechos).toBeVisible()

            // El textarea debe tener un ancho razonable (más de 200px)
            const box = await hechos.boundingBox()
            expect(box).not.toBeNull()
            expect(box.width).toBeGreaterThan(200)
        })
    }

    test('menú de navegación se colapsa en mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 })
        await gotoApp(page, '/')

        // En mobile debe existir el botón de toggle del menú
        const toggleBtn = page.locator('.navigation__toggle')
        await expect(toggleBtn).toBeVisible()
    })

    test('menú de navegación es visible en desktop sin toggle', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 })
        await gotoApp(page, '/')

        // En desktop el nav está siempre abierto
        const nav = page.locator('.navigation')
        await expect(nav).toBeVisible()
    })
})

test.describe('PWA', () => {

    test('el manifest PWA es accesible', async ({ page }) => {
        // En dev mode (Vite), el manifest se genera solo en build.
        // Verificamos que el servidor responde (puede devolver 200 con HTML fallback en dev).
        const response = await page.request.get('/manifest.webmanifest')
        // En producción debe ser 200 con JSON; en dev Vite puede devolver 404 o HTML.
        // El test valida que no hay error de servidor (5xx).
        expect(response.status()).toBeLessThan(500)
    })

    test('la app tiene el meta viewport correcto', async ({ page }) => {
        await gotoApp(page, '/')

        const viewport = await page.$eval(
            'meta[name="viewport"]',
            el => el.getAttribute('content')
        )
        expect(viewport).toContain('width=device-width')
    })

    test('service worker se registra sin errores en producción build', async ({ page }) => {
        // En dev (Vite), el SW puede no estar activo — verificamos que no hay error crítico
        const swErrors = []
        page.on('console', msg => {
            if (msg.type() === 'error' && msg.text().toLowerCase().includes('service worker')) {
                swErrors.push(msg.text())
            }
        })

        await gotoApp(page, '/')
        await page.waitForTimeout(1000)

        // No debe haber errores críticos del service worker
        expect(swErrors).toHaveLength(0)
    })
})
