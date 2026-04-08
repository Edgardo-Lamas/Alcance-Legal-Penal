/**
 * Build script — Extensión Chrome "MEV Navigator"
 * Genera el ZIP listo para subir a Chrome Web Store
 *
 * Uso: node scripts/build-extension.js
 *
 * Output: alcance-legal-mev-navigator-v{version}.zip
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SRC = path.join(ROOT, 'chrome-extension')
const DIST = path.join(ROOT, 'dist-extension')

// Archivos/carpetas que NO se incluyen en el ZIP
const EXCLUDE = new Set([
    'README.md',
    'generate-icons.html',
    '.DS_Store',
    'Thumbs.db',
])
const EXCLUDE_EXT = new Set(['.map', '.test.js', '.spec.js'])

// ─── Utilidades ──────────────────────────────────────────────────────────────

function log(icon, msg) { console.log(`${icon} ${msg}`) }
function err(msg) { console.error(`  ❌ ${msg}`); process.exitCode = 1 }
function ok(msg)  { console.log(`  ✅ ${msg}`) }
function warn(msg){ console.log(`  ⚠️  ${msg}`) }

function humanSize(bytes) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function sha256(filePath) {
    const buf = fs.readFileSync(filePath)
    return crypto.createHash('sha256').update(buf).digest('hex')
}

function copyRecursive(src, dest, files = []) {
    const stat = fs.statSync(src)
    const name = path.basename(src)

    if (EXCLUDE.has(name)) return
    if (EXCLUDE_EXT.has(path.extname(name))) return

    if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true })
        for (const child of fs.readdirSync(src)) {
            copyRecursive(path.join(src, child), path.join(dest, child), files)
        }
    } else {
        fs.copyFileSync(src, dest)
        files.push(dest)
    }
}

function totalDirSize(dir) {
    let size = 0
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) size += totalDirSize(full)
        else size += fs.statSync(full).size
    }
    return size
}

// ─── Validaciones ─────────────────────────────────────────────────────────────

function validateManifest(manifestPath) {
    log('🔍', 'Validando manifest.json...')
    let manifest
    try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
    } catch (e) {
        err(`manifest.json no es JSON válido: ${e.message}`)
        return null
    }

    const required = ['manifest_version', 'name', 'version', 'description']
    for (const field of required) {
        if (!manifest[field]) {
            err(`Campo requerido faltante en manifest: "${field}"`)
        } else {
            ok(`manifest.${field} = "${String(manifest[field]).substring(0, 60)}"`)
        }
    }

    // Longitud del name
    const nameLen = [...manifest.name].length
    if (nameLen > 45) err(`name demasiado largo: ${nameLen} chars (máx 45)`)
    else ok(`name length: ${nameLen}/45 chars`)

    // Longitud de description
    const descLen = [...(manifest.description || '')].length
    if (descLen > 132) err(`description demasiado larga: ${descLen} chars (máx 132)`)
    else ok(`description length: ${descLen}/132 chars`)

    // Version format
    if (!/^\d+\.\d+\.\d+$/.test(manifest.version)) {
        err(`version no sigue formato X.Y.Z: "${manifest.version}"`)
    }

    return manifest
}

function validateIcons(iconsDir, manifest) {
    log('\n🎨', 'Verificando íconos...')
    const required = [16, 48, 128]
    let allOk = true

    for (const size of required) {
        const filePath = path.join(iconsDir, `icon${size}.png`)
        if (!fs.existsSync(filePath)) {
            err(`icon${size}.png no existe en chrome-extension/icons/`)
            allOk = false
        } else {
            const stat = fs.statSync(filePath)
            ok(`icon${size}.png — ${humanSize(stat.size)}`)
        }
    }

    return allOk
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('═══════════════════════════════════════════════════════')
    console.log('  Build Extensión Chrome — MEV Navigator')
    console.log('  Alcance Legal Penal')
    console.log('═══════════════════════════════════════════════════════\n')

    // 1. Validar manifest
    const manifestPath = path.join(SRC, 'manifest.json')
    const manifest = validateManifest(manifestPath)
    if (!manifest || process.exitCode === 1) {
        console.error('\n❌ Build cancelado por errores en manifest.json')
        process.exit(1)
    }

    // 2. Verificar íconos
    const iconsDir = path.join(SRC, 'icons')
    const iconsOk = validateIcons(iconsDir, manifest)
    if (!iconsOk) {
        console.error('\n❌ Íconos faltantes. Ejecutá primero: npm run build:icons')
        process.exit(1)
    }

    // 3. Limpiar y copiar a dist-extension/
    log('\n📁', 'Preparando dist-extension/...')
    if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true })
    fs.mkdirSync(DIST, { recursive: true })

    const includedFiles = []
    copyRecursive(SRC, DIST, includedFiles)

    console.log('\n  Archivos incluidos:')
    for (const f of includedFiles) {
        const rel = path.relative(DIST, f)
        const size = humanSize(fs.statSync(f).size)
        console.log(`    • ${rel} (${size})`)
    }

    const totalSize = totalDirSize(DIST)
    log('\n📦', `Tamaño total del paquete: ${humanSize(totalSize)}`)

    if (totalSize > 10 * 1024 * 1024) {
        warn(`El paquete supera 10 MB — Chrome Web Store tiene límite de 128 MB pero idealmente < 1 MB para extensiones ligeras.`)
    }

    // 4. Generar ZIP
    const version = manifest.version
    const zipName = `alcance-legal-mev-navigator-v${version}.zip`
    const zipPath = path.join(ROOT, zipName)

    log('\n🗜️', `Generando ${zipName}...`)
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath)

    // Usa zip nativo del sistema (disponible en macOS/Linux/WSL)
    execSync(`cd "${DIST}" && zip -r "${zipPath}" .`, { stdio: 'pipe' })

    const zipStat = fs.statSync(zipPath)
    ok(`ZIP generado: ${zipName} (${humanSize(zipStat.size)})`)

    // 5. SHA256
    const checksum = sha256(zipPath)
    log('\n🔐', `SHA256: ${checksum}`)

    // 6. Resumen final
    console.log('\n═══════════════════════════════════════════════════════')
    console.log('  RESULTADO')
    console.log('═══════════════════════════════════════════════════════')
    console.log(`  Archivo:   ${zipName}`)
    console.log(`  Tamaño:    ${humanSize(zipStat.size)}`)
    console.log(`  SHA256:    ${checksum}`)
    console.log(`  Archivos:  ${includedFiles.length} archivos incluidos`)
    console.log(`  Versión:   v${version}`)
    console.log('═══════════════════════════════════════════════════════')
    console.log('\n  ✅ ZIP listo para subir a Chrome Web Store Developer Dashboard')
    console.log(`     https://chrome.google.com/webstore/devconsole\n`)
}

main().catch((e) => {
    console.error('Error fatal:', e.message)
    process.exit(1)
})
