import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // En dev local: base '/' → visitar http://localhost:5173/
  // En build producción (GitHub Pages): base '/Alcance-Legal-Penal/'
  base: command === 'build' ? '/Alcance-Legal-Penal/' : '/',
  plugins: [react()],
  server: {
    host: true,
  }
}))
