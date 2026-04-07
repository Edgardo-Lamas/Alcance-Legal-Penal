import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 30_000,
    expect: { timeout: 8_000 },
    fullyParallel: false,
    retries: 1,
    workers: 1,
    reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],

    use: {
        baseURL: 'http://localhost:5175',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'off',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    webServer: {
        // Inicia Vite en modo test (carga .env.test):
        //   VITE_USE_MOCKS=true + Supabase vacío → auth deshabilitado + mocks activos
        command: 'npx vite --mode test --port 5175',
        url: 'http://localhost:5175',
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
        stdout: 'ignore',
        stderr: 'pipe',
    },
})
