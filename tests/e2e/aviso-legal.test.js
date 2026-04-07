/**
 * FLUJO 2 — Aviso Legal (DisclaimerAcceptance)
 *
 * Estos tests NO usan bypassDisclaimer() — prueban el flujo real del disclaimer.
 * La pantalla de aceptación es un bloqueante obligatorio antes de cualquier uso.
 */
import { test, expect } from '@playwright/test'

test.describe('Aviso Legal (DisclaimerAcceptance)', () => {

    test.beforeEach(async ({ page }) => {
        // Limpiar localStorage para que aparezca el disclaimer
        await page.addInitScript(() => {
            localStorage.removeItem('alcance_legal_disclaimer_accepted')
        })
    })

    test('muestra pantalla de aviso legal al primer acceso', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        await expect(page.getByText('AVISO LEGAL OBLIGATORIO')).toBeVisible()
        await expect(page.getByRole('heading', { name: 'Alcance Legal Penal' })).toBeVisible()
    })

    test('botón "Ingresar al sistema" está deshabilitado antes de scroll', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        const btnIngresar = page.getByRole('button', { name: 'Ingresar al sistema' })
        await expect(btnIngresar).toBeDisabled()
    })

    test('checkbox está deshabilitado antes de scroll al final', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        // El checkbox tiene disabled cuando no se scrolleó
        const checkbox = page.locator('.da-checkbox input[type="checkbox"]')
        await expect(checkbox).toBeDisabled()
    })

    test('scroll al final habilita el checkbox', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        // Hacer scroll al final del panel de contenido
        await page.locator('.da-contenido').evaluate(el => {
            el.scrollTop = el.scrollHeight
        })

        // Esperar a que el estado se actualice
        await page.waitForTimeout(500)

        const checkbox = page.locator('.da-checkbox input[type="checkbox"]')
        await expect(checkbox).toBeEnabled()
    })

    test('aceptar aviso legal da acceso al sistema', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        // Scroll al final del contenido
        await page.locator('.da-contenido').evaluate(el => {
            el.scrollTop = el.scrollHeight
        })
        await page.waitForTimeout(300)

        // Marcar checkbox
        await page.locator('.da-checkbox input[type="checkbox"]').check()

        // Hacer clic en "Ingresar al sistema"
        await page.getByRole('button', { name: 'Ingresar al sistema' }).click()
        await page.waitForLoadState('networkidle')

        // Ya no debe mostrar el aviso legal
        await expect(page.getByText('AVISO LEGAL OBLIGATORIO')).not.toBeVisible()
    })

    test('aceptación persiste en localStorage', async ({ page }) => {
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        // Aceptar
        await page.locator('.da-contenido').evaluate(el => { el.scrollTop = el.scrollHeight })
        await page.waitForTimeout(300)
        await page.locator('.da-checkbox input[type="checkbox"]').check()
        await page.getByRole('button', { name: 'Ingresar al sistema' }).click()
        await page.waitForLoadState('networkidle')

        // Verificar que se guardó en localStorage
        const stored = await page.evaluate(() => {
            const raw = localStorage.getItem('alcance_legal_disclaimer_accepted')
            return raw ? JSON.parse(raw) : null
        })
        expect(stored).not.toBeNull()
        expect(stored.version).toBe('1.1')
    })
})
