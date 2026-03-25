import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '../public')

const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#0f172a"/>
  <!-- Balanza de la justicia -->
  <!-- Mástil central -->
  <rect x="248" y="120" width="16" height="260" rx="8" fill="#c9a227"/>
  <!-- Base -->
  <rect x="176" y="364" width="160" height="16" rx="8" fill="#c9a227"/>
  <rect x="216" y="380" width="80" height="12" rx="6" fill="#c9a227"/>
  <!-- Travesaño horizontal -->
  <rect x="144" y="148" width="224" height="14" rx="7" fill="#c9a227"/>
  <!-- Cadena izquierda -->
  <rect x="156" y="162" width="8" height="70" rx="4" fill="#c9a227" opacity="0.8"/>
  <!-- Plato izquierdo -->
  <ellipse cx="160" cy="242" rx="52" ry="14" fill="none" stroke="#c9a227" stroke-width="10"/>
  <!-- Cadena derecha -->
  <rect x="348" y="162" width="8" height="70" rx="4" fill="#c9a227" opacity="0.8"/>
  <!-- Plato derecho -->
  <ellipse cx="352" cy="242" rx="52" ry="14" fill="none" stroke="#c9a227" stroke-width="10"/>
  <!-- Punto central del travesaño -->
  <circle cx="256" cy="148" r="12" fill="#c9a227"/>
</svg>
`

const sizes = [192, 512]

for (const size of sizes) {
  await sharp(Buffer.from(svgIcon))
    .resize(size, size)
    .png()
    .toFile(join(publicDir, `pwa-${size}.png`))
  console.log(`✓ pwa-${size}.png generado`)
}

// Apple touch icon (180x180)
await sharp(Buffer.from(svgIcon))
  .resize(180, 180)
  .png()
  .toFile(join(publicDir, 'apple-touch-icon.png'))
console.log('✓ apple-touch-icon.png generado')

console.log('Íconos PWA generados correctamente.')
