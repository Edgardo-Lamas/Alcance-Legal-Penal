import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Ignorar artefactos de build / reportes (antes contaminaban el lint con miles de errores).
  globalIgnores([
    'dist',
    'dist-extension',
    'playwright-report',
    'test-results',
    'node_modules',
  ]),
  // App (browser)
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      // Reglas de estilo/nuevas: se dejan como advertencia para no bloquear CI
      // (patrones legítimos de setState en efectos de init; export de hook junto al provider).
      'react-hooks/set-state-in-effect': 'warn',
      'react-refresh/only-export-components': 'warn',
    },
  },
  // Scripts Node (build de extensión, carga de corpus, etc.) — usan `process`, `__dirname`…
  {
    files: ['scripts/**/*.js', 'supabase/scripts/**/*.js', '*.config.js', 'playwright.config.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: { ...globals.node },
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
    },
  },
])
