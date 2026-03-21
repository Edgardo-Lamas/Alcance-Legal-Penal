/**
 * Script de Carga de Criterios Penales a Supabase
 *
 * Carga los archivos JSON del corpus penal, genera embeddings con OpenAI
 * y los inserta en la tabla criterios_juridicos de Supabase.
 *
 * Ejecutar: node scripts/load-criterios.js
 * Requiere: SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY en .env
 *
 * Estructura esperada del corpus:
 *   knowledge/jurisprudencia_publica/penal/<categoria>/PENAL-*.json
 */

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ============================================
// CONFIGURACIÓN
// ============================================

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

// Ruta base del corpus penal
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

// Clientes
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

// ============================================
// EMBEDDING
// ============================================

/**
 * Genera embedding para un texto usando text-embedding-ada-002.
 */
async function generarEmbedding(texto) {
    const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: texto
    })
    return response.data[0].embedding
}

// ============================================
// TRANSFORMACIÓN: JSON penal → registro DB
// ============================================

/**
 * Convierte un criterio penal JSON al formato de inserción en la DB.
 *
 * Schema penal (campos directos, sin extracción anidada):
 *   id, instituto, subtipo, criterio, regla_general, articulos_cpp,
 *   nivel_autoridad, aplicacion_practica, condiciones_aplicacion,
 *   riesgos_procesales, jurisdiccion, alcance
 *
 * Texto para embedding: criterio + regla_general + aplicacion_practica
 *   + condiciones_aplicacion + riesgos_procesales + tags
 *   → mayor densidad semántica = mejor recuperación en RAG
 */
function criterioARegistro(criterio) {
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
        criterio: criterio.criterio,
        regla_general: criterio.regla_general,
        articulos_cpp: criterio.articulos_cpp || [],
        nivel_autoridad: criterio.nivel_autoridad || 'orientativo',
        data: criterio  // JSON completo en columna JSONB
    }
}

// ============================================
// CARGA POR CATEGORÍA
// ============================================

/**
 * Carga todos los criterios PENAL-*.json de una categoría.
 */
async function cargarCategoria(categoriaPath, nombreCategoria) {
    if (!fs.existsSync(categoriaPath)) {
        console.log(`⚠️  Categoría no encontrada: ${nombreCategoria}`)
        return 0
    }

    const archivos = fs.readdirSync(categoriaPath)
        .filter(f => f.endsWith('.json') && f.startsWith('PENAL-'))
        .sort()  // Orden determinístico

    if (archivos.length === 0) {
        console.log(`   ℹ️  Sin archivos PENAL-*.json en: ${nombreCategoria}`)
        return 0
    }

    console.log(`\n📂 ${nombreCategoria}: ${archivos.length} criterios`)

    let cargados = 0
    for (const archivo of archivos) {
        const archivoPath = path.join(categoriaPath, archivo)

        let criterioJson
        try {
            criterioJson = JSON.parse(fs.readFileSync(archivoPath, 'utf8'))
        } catch (parseErr) {
            console.error(`   ❌ JSON inválido en ${archivo}:`, parseErr.message)
            continue
        }

        try {
            const registro = criterioARegistro(criterioJson)

            console.log(`   🔄 ${registro.id} — generando embedding...`)
            registro.embedding = await generarEmbedding(registro.contenido)

            const { error } = await supabase
                .from('criterios_juridicos')
                .upsert(registro, { onConflict: 'id' })

            if (error) {
                console.error(`   ❌ Error insertando ${registro.id}:`, error.message)
            } else {
                console.log(`   ✅ ${registro.id} — cargado`)
                cargados++
            }

            // Rate limiting OpenAI
            await new Promise(r => setTimeout(r, OPENAI_RATE_LIMIT_MS))

        } catch (err) {
            console.error(`   ❌ Error procesando ${archivo}:`, err.message)
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

    // Auto-descubrir todas las categorías (subdirectorios, excluir _meta y ocultos)
    const categorias = fs.readdirSync(CORPUS_BASE_PATH, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && !entry.name.startsWith('_'))
        .map(entry => entry.name)
        .sort()

    if (categorias.length === 0) {
        console.error('❌ No se encontraron categorías en el corpus')
        process.exit(1)
    }

    console.log(`\n📋 Categorías encontradas: ${categorias.join(', ')}`)

    let totalCargados = 0
    let totalErrores = 0

    for (const categoria of categorias) {
        const categoriaPath = path.join(CORPUS_BASE_PATH, categoria)
        try {
            const cargados = await cargarCategoria(categoriaPath, categoria)
            totalCargados += cargados
        } catch (err) {
            console.error(`❌ Error en categoría ${categoria}:`, err.message)
            totalErrores++
        }
    }

    console.log('\n' + '='.repeat(50))
    console.log(`✅ Carga completada: ${totalCargados} criterios insertados`)
    if (totalErrores > 0) {
        console.log(`⚠️  Categorías con error: ${totalErrores}`)
    }

    // Verificar estado final en la DB
    const { count, error: countError } = await supabase
        .from('criterios_juridicos')
        .select('*', { count: 'exact', head: true })
        .eq('alcance', 'criterios_generales')

    if (!countError) {
        console.log(`📊 Total en DB (alcance=criterios_generales): ${count} criterios`)
    }

    // Resumen por instituto
    const { data: institutos, error: institErr } = await supabase
        .from('criterios_juridicos')
        .select('instituto')
        .eq('alcance', 'criterios_generales')

    if (!institErr && institutos) {
        const conteo = institutos.reduce((acc, row) => {
            acc[row.instituto] = (acc[row.instituto] || 0) + 1
            return acc
        }, {})
        console.log('\n📊 Distribución por instituto:')
        Object.entries(conteo).sort().forEach(([inst, n]) => {
            console.log(`   ${inst}: ${n}`)
        })
    }
}

main().catch(err => {
    console.error('❌ Error fatal:', err.message)
    process.exit(1)
})
