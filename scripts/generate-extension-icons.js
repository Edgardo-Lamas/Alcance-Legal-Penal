/**
 * Genera los íconos PNG para la extensión Chrome (16x16, 48x48, 128x128)
 * Usa sharp (ya incluido en devDependencies) para convertir SVG → PNG
 *
 * Uso: node scripts/generate-extension-icons.js
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ICONS_DIR = path.resolve(__dirname, '../chrome-extension/icons')

if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR, { recursive: true })

/**
 * Genera el SVG del ícono ALP en el tamaño dado.
 * Monograma "ALP" sobre fondo azul marino con borde dorado.
 */
function buildSvg(size) {
    const fontSize = Math.round(size * 0.30)
    const borderRadius = Math.round(size * 0.18)
    const borderWidth = Math.max(1, Math.round(size * 0.05))

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a3a5c;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0d2a4a;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect
    x="${borderWidth / 2}" y="${borderWidth / 2}"
    width="${size - borderWidth}" height="${size - borderWidth}"
    rx="${borderRadius}" ry="${borderRadius}"
    fill="url(#bg)"
    stroke="#c9a84c"
    stroke-width="${borderWidth}"
  />
  <text
    x="50%" y="54%"
    dominant-baseline="middle"
    text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif"
    font-size="${fontSize}"
    font-weight="800"
    fill="#c9a84c"
    letter-spacing="${Math.round(size * 0.02)}"
  >ALP</text>
</svg>`
}

const SIZES = [16, 48, 128]

async function main() {
    console.log('Generando íconos para la extensión Chrome...\n')

    for (const size of SIZES) {
        const svg = buildSvg(size)
        const outPath = path.join(ICONS_DIR, `icon${size}.png`)

        await sharp(Buffer.from(svg))
            .resize(size, size)
            .png()
            .toFile(outPath)

        const stat = fs.statSync(outPath)
        console.log(`  ✓ icon${size}.png — ${stat.size} bytes`)
    }

    console.log('\nÍconos generados en chrome-extension/icons/')
}

main().catch((err) => {
    console.error('Error:', err.message)
    process.exit(1)
})
