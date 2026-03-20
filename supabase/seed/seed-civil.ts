/**
 * Script de ingesta del corpus Civil — Alcance Legal
 *
 * Lee los criterios de criterios-civil.ts, genera embeddings con OpenAI
 * y los inserta en la tabla criterios_juridicos del proyecto Supabase Civil.
 *
 * Uso:
 *   deno run --allow-net --allow-env --allow-read \
 *     --env-file=.env.civil \
 *     supabase/seed/seed-civil.ts
 *
 * Requisitos previos:
 *   1. Migración 001 aplicada en el proyecto Supabase Civil
 *   2. .env.civil con SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { CRITERIOS_CIVIL, type CriterioSeed } from './criterios-civil.ts'

// ============================================
// CONFIGURACIÓN
// ============================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
  console.error('❌ Variables de entorno faltantes. Verificar .env.civil')
  Deno.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Pausa entre embeddings para no exceder rate limits de OpenAI (3500 RPM en tier 1)
const DELAY_MS = 300

// ============================================
// FUNCIONES
// ============================================

async function generarEmbedding(texto: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: texto,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI error: ${error}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function insertarCriterio(criterio: CriterioSeed, embedding: number[]): Promise<void> {
  const { error } = await supabase
    .from('criterios_juridicos')
    .upsert({
      id:             criterio.id,
      contenido:      criterio.contenido,
      instituto:      criterio.instituto,
      subtipo:        criterio.subtipo,
      jurisdiccion:   criterio.jurisdiccion,
      alcance:        criterio.alcance,
      criterio:       criterio.criterio,
      regla_general:  criterio.regla_general,
      articulos_ccyc: criterio.articulos_ccyc,
      nivel_autoridad: criterio.nivel_autoridad,
      data: {
        id:             criterio.id,
        instituto:      criterio.instituto,
        subtipo:        criterio.subtipo,
        criterio:       criterio.criterio,
        regla_general:  criterio.regla_general,
        articulos_ccyc: criterio.articulos_ccyc,
        nivel_autoridad: criterio.nivel_autoridad,
        fuente:         'CCyC Ley 26.994',
        version_corpus: '1.0',
      },
      embedding,
    }, { onConflict: 'id' })

  if (error) {
    throw new Error(`Supabase insert error (${criterio.id}): ${error.message}`)
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('=== Alcance Legal — Ingesta corpus Civil ===')
  console.log(`Proyecto: ${SUPABASE_URL}`)
  console.log(`Criterios a procesar: ${CRITERIOS_CIVIL.length}`)
  console.log('')

  let exitosos = 0
  let fallidos = 0

  for (let i = 0; i < CRITERIOS_CIVIL.length; i++) {
    const criterio = CRITERIOS_CIVIL[i]
    const progreso = `[${String(i + 1).padStart(2, '0')}/${CRITERIOS_CIVIL.length}]`

    try {
      process.stdout.write(`${progreso} ${criterio.id} — generando embedding...`)

      const embedding = await generarEmbedding(criterio.contenido)

      process.stdout.write(' inserting...')
      await insertarCriterio(criterio, embedding)

      console.log(` ✅ ${criterio.criterio.substring(0, 50)}`)
      exitosos++

      // Pausa para no saturar la API de OpenAI
      if (i < CRITERIOS_CIVIL.length - 1) {
        await sleep(DELAY_MS)
      }
    } catch (error) {
      console.log(` ❌ ERROR: ${error.message}`)
      fallidos++
    }
  }

  console.log('')
  console.log('=== Resultado ===')
  console.log(`✅ Exitosos: ${exitosos}`)
  if (fallidos > 0) {
    console.log(`❌ Fallidos: ${fallidos}`)
    console.log('   Revisar errores arriba y re-ejecutar el script (upsert es idempotente)')
  }
  console.log('')

  if (exitosos > 0) {
    // Verificar que los criterios quedaron en la DB
    const { count, error } = await supabase
      .from('criterios_juridicos')
      .select('*', { count: 'exact', head: true })

    if (!error) {
      console.log(`📊 Total criterios en DB: ${count}`)
    }
  }

  console.log('')
  console.log('Próximo paso: verificar con una búsqueda de prueba')
  console.log('  deno run --allow-net --allow-env --allow-read \\')
  console.log('    --env-file=.env.civil \\')
  console.log('    supabase/seed/test-search-civil.ts')
}

main().catch((err) => {
  console.error('Error fatal:', err)
  Deno.exit(1)
})
