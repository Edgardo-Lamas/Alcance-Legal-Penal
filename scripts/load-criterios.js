/**
 * Script de Carga de Criterios Penales a Supabase
 *
 * Carga los criterios del corpus penal, genera embeddings con OpenAI
 * y los inserta en la tabla criterios_juridicos de Supabase.
 *
 * Ejecutar: node scripts/load-criterios.js
 * Requiere: SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY en .env.local
 *
 * Fuentes de datos soportadas:
 *   1. knowledge/jurisprudencia_publica/penal/corpus_criterios_v1.json  (array)
 *   2. knowledge/jurisprudencia_publica/penal/<categoria>/PENAL-*.json  (individuales)
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

// Cargar .env.local
config({ path: '.env.local' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ============================================
// CONFIGURACIÓN
// ============================================

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

const CORPUS_BASE_PATH = path.join(
    __dirname,
    '../knowledge/jurisprudencia_publica/penal'
)

// Rate limiting para la API de OpenAI (ms entre llamadas)
const OPENAI_RATE_LIMIT_MS = 200

// Validar configuración
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
    console.error('❌ Faltan variables de entorno:')
    console.error('   SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌')
    console.error('   SUPABASE_SERVICE_KEY:', SUPABASE_SERVICE_KEY ? '✅' : '❌')
    console.error('   OPENAI_API_KEY:', OPENAI_API_KEY ? '✅' : '❌')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

// ============================================
// EMBEDDING
// ============================================

async function generarEmbedding(texto) {
    const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: texto.slice(0, 8000) // límite seguro de tokens
    })
    return response.data[0].embedding
}

// ============================================
// TRANSFORMACIÓN: corpus JSON → registro DB
//
// Soporta dos esquemas:
//
// Esquema corpus_criterios_v1.json:
//   { id, fuero, tema, texto_regla, aplicacion_practica, etiquetas, fuente, referencias }
//
// Esquema individual PENAL-*.json (legado):
//   { id, criterio, regla_general, instituto, subtipo, articulos_cpp, nivel_autoridad, ... }
// ============================================

function criterioARegistro(criterio) {
    const esCorpusV1 = criterio.texto_regla !== undefined && criterio.regla_general === undefined

    if (esCorpusV1) {
        // Mapeo desde esquema corpus_criterios_v1
        const nombre = (criterio.tema || criterio.id).replace(/_/g, ' ')
        const etiquetas = criterio.etiquetas || []

        const textoEmbedding = [
            nombre,
            criterio.texto_regla,
            criterio.aplicacion_practica || '',
            ...(criterio.fuente?.norma ? [criterio.fuente.norma] : []),
            ...etiquetas
        ].filter(Boolean).join(' ')

        return {
            id: criterio.id,
            contenido: textoEmbedding,
            instituto: etiquetas[0] || criterio.tema || 'garantias',
            subtipo: criterio.tema || criterio.id,
            jurisdiccion: 'argentina_pba',
            alcance: 'criterios_generales',
            fuero: 'penal',
            criterio: nombre,
            regla_general: criterio.texto_regla,
            articulos_cpp: criterio.referencias || [],
            nivel_autoridad: 'orientativo',
            data: criterio
        }
    }

    // Esquema individual legado
    const textoEmbedding = [
        criterio.criterio,
        criterio.regla_general,
        criterio.aplicacion_practica || '',
        ...(criterio.condiciones_aplicacion || []),
        ...(criterio.riesgos_procesales || []),
        ...(criterio.tags || [])
    ].filter(Boolean).join(' ')

    return {
        id: criterio.id,
        contenido: textoEmbedding,
        instituto: criterio.instituto,
        subtipo: criterio.subtipo,
        jurisdiccion: criterio.jurisdiccion || 'argentina_pba',
        alcance: criterio.alcance || 'criterios_generales',
        fuero: 'penal',
        criterio: criterio.criterio,
        regla_general: criterio.regla_general,
        articulos_cpp: criterio.articulos_cpp || [],
        nivel_autoridad: criterio.nivel_autoridad || 'orientativo',
        data: criterio
    }
}

// ============================================
// INSERCIÓN EN DB
// ============================================

async function insertarCriterio(registro) {
    console.log(`   🔄 ${registro.id} — generando embedding...`)
    registro.embedding = await generarEmbedding(registro.contenido)

    const { error } = await supabase
        .from('criterios_juridicos')
        .upsert(registro, { onConflict: 'id' })

    if (error) {
        console.error(`   ❌ Error insertando ${registro.id}:`, error.message)
        return false
    }

    console.log(`   ✅ ${registro.id} — cargado`)
    await new Promise(r => setTimeout(r, OPENAI_RATE_LIMIT_MS))
    return true
}

// ============================================
// FUENTE 1: corpus_criterios_v1.json (array en raíz del corpus)
// ============================================

async function cargarCorpusArray(rutaArchivo) {
    if (!fs.existsSync(rutaArchivo)) return 0

    console.log(`\n📂 corpus_criterios_v1.json`)
    let raw
    try {
        raw = JSON.parse(fs.readFileSync(rutaArchivo, 'utf8'))
    } catch (e) {
        console.error(`   ❌ JSON inválido:`, e.message)
        return 0
    }

    const criterios = Array.isArray(raw) ? raw : [raw]
    console.log(`   ${criterios.length} criterios encontrados`)

    let cargados = 0
    for (const criterio of criterios) {
        try {
            const registro = criterioARegistro(criterio)
            const ok = await insertarCriterio(registro)
            if (ok) cargados++
        } catch (e) {
            console.error(`   ❌ Error procesando ${criterio?.id}:`, e.message)
        }
    }
    return cargados
}

// ============================================
// FUENTE 2: archivos individuales PENAL-*.json (en subdirectorios)
// ============================================

async function cargarCategoria(categoriaPath, nombreCategoria) {
    if (!fs.existsSync(categoriaPath)) return 0

    const archivos = fs.readdirSync(categoriaPath)
        .filter(f => f.endsWith('.json') && f.startsWith('PENAL-'))
        .sort()

    if (archivos.length === 0) return 0

    console.log(`\n📂 ${nombreCategoria}: ${archivos.length} criterios`)

    let cargados = 0
    for (const archivo of archivos) {
        const archivoPath = path.join(categoriaPath, archivo)
        let criterioJson
        try {
            criterioJson = JSON.parse(fs.readFileSync(archivoPath, 'utf8'))
        } catch (e) {
            console.error(`   ❌ JSON inválido en ${archivo}:`, e.message)
            continue
        }

        try {
            const registro = criterioARegistro(criterioJson)
            const ok = await insertarCriterio(registro)
            if (ok) cargados++
        } catch (e) {
            console.error(`   ❌ Error procesando ${archivo}:`, e.message)
        }
    }
    return cargados
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

async function main() {
    console.log('🚀 Carga de corpus penal PBA → Supabase')
    console.log('   Supabase URL:', SUPABASE_URL)
    console.log('   Corpus path:', CORPUS_BASE_PATH)

    if (!fs.existsSync(CORPUS_BASE_PATH)) {
        console.error('❌ No existe el directorio del corpus:', CORPUS_BASE_PATH)
        process.exit(1)
    }

    let totalCargados = 0

    // Fuente 1: corpus array en raíz
    const corpusArrayPath = path.join(CORPUS_BASE_PATH, 'corpus_criterios_v1.json')
    totalCargados += await cargarCorpusArray(corpusArrayPath)

    // Fuente 2: archivos individuales en subdirectorios
    const categorias = fs.readdirSync(CORPUS_BASE_PATH, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && !entry.name.startsWith('_'))
        .map(entry => entry.name)
        .sort()

    for (const categoria of categorias) {
        const categoriaPath = path.join(CORPUS_BASE_PATH, categoria)
        totalCargados += await cargarCategoria(categoriaPath, categoria)
    }

    console.log('\n' + '='.repeat(50))
    console.log(`✅ Carga completada: ${totalCargados} criterios insertados`)

    // Verificar estado final en la DB
    const { count, error: countError } = await supabase
        .from('criterios_juridicos')
        .select('*', { count: 'exact', head: true })
        .eq('alcance', 'criterios_generales')

    if (!countError) {
        console.log(`📊 Total en DB (alcance=criterios_generales): ${count} criterios`)
    }
}

main().catch(err => {
    console.error('❌ Error fatal:', err.message)
    process.exit(1)
})
