/**
 * FLUJO 1 — Autenticación
 *
 * En modo test Supabase está deshabilitado → auth bypass automático.
 * Estos tests verifican el comportamiento de la UI de login y las
 * rutas protegidas en el entorno real (con Supabase configurado).
 * En modo test sin Supabase, validamos la estructura del formulario.
 */
import { test, expect } from '@playwright/test'
import { bypassDisclaimer, gotoApp, TEXTOS } from './helpers.js'

test.describe('Autenticación', () => {

    test('página de login renderiza correctamente', async ({ page }) => {
        await bypassDisclaimer(page)
        await page.goto('/login')
        await page.waitForLoadState('networkidle')

        // Título del sistema
        await expect(page.getByText('Alcance Legal')).toBeVisible()
        await expect(page.getByText('Inteligencia Jurídica Penal · CPP PBA')).toBeVisible()

        // Formulario presente
        await expect(page.locator('#email')).toBeVisible()
        await expect(page.locator('#password')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Ingresar al sistema' })).toBeVisible()
    })

    test('login con credenciales inválidas muestra error', async ({ page }) => {
        await bypassDisclaimer(page)
        await page.goto('/login')
        await page.waitForLoadState('networkidle')

        await page.fill('#email', 'invalido@test.com')
        await page.fill('#password', 'wrongpassword')
        await page.getByRole('button', { name: 'Ingresar al sistema' }).click()

        // Esperar respuesta (Supabase null → error inmediato; real → async)
        await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 })
        const errorText = await page.locator('[role="alert"]').textContent()
        expect(errorText).toBeTruthy()
        expect(errorText.length).toBeGreaterThan(0)
    })

    test('tab Crear cuenta muestra formulario de registro', async ({ page }) => {
        await bypassDisclaimer(page)
        await page.goto('/login')
        await page.waitForLoadState('networkidle')

        await page.getByRole('button', { name: 'Crear cuenta' }).click()

        await expect(page.locator('#reg-nombre')).toBeVisible()
        await expect(page.locator('#reg-email')).toBeVisible()
        await expect(page.locator('#reg-password')).toBeVisible()
        await expect(page.locator('#reg-confirm')).toBeVisible()
    })

    test('registro con contraseñas que no coinciden muestra error', async ({ page }) => {
        await bypassDisclaimer(page)
        await page.goto('/login')
        await page.waitForLoadState('networkidle')

        await page.getByRole('button', { name: 'Crear cuenta' }).click()

        await page.fill('#reg-email', 'test@test.com')
        await page.fill('#reg-password', 'password123')
        await page.fill('#reg-confirm', 'diferente456')
        await page.getByRole('button', { name: 'Crear cuenta gratuita' }).click()

        await expect(page.locator('[role="alert"]')).toBeVisible()
        await expect(page.locator('[role="alert"]')).toContainText('contraseñas no coinciden')
    })

    test('acceso a dashboard en modo sin auth (test mode)', async ({ page }) => {
        // En modo test, auth está deshabilitado → dashboard accesible sin login
        await gotoApp(page, '/')
        await expect(page.getByText(TEXTOS.dashboard.titulo)).toBeVisible()
    })

    test('rutas protegidas accesibles en modo sin Supabase', async ({ page }) => {
        // Sin Supabase (modo test), RequireAuth no bloquea
        await gotoApp(page, '/analizar')
        await expect(page.getByText(TEXTOS.analizar.titulo)).toBeVisible()
    })
})
