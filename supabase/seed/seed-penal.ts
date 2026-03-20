/**
 * Script de ingesta del corpus penal — Alcance Legal Penal
 *
 * Genera embeddings OpenAI para cada criterio y los inserta en Supabase.
 * Idempotente: usa upsert por ID, puede ejecutarse múltiples veces.
 *
 * Uso:
 *   deno run --allow-net --allow-env --allow-read \
 *     --env-file=.env.penal \
 *     supabase/seed/seed-penal.ts
 *
 * Variables requeridas en .env.penal:
 *   SUPABASE_URL=https://<ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
 *   OPENAI_API_KEY=<openai_key>
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { CRITERIOS_PENAL } from './criterios-penal.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
  console.error('❌ Variables de entorno faltantes.')
  console.error('   Requeridas: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY')
  Deno.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function generarEmbedding(texto: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'text-embedding-ada-002', input: texto }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI Embeddings error: ${await response.text()}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

async function main() {
  console.log('=== Seed: Corpus Penal PBA ===')
  console.log(`   Proyecto: ${SUPABASE_URL}`)
  console.log(`   Criterios a insertar: ${CRITERIOS_PENAL.length}\n`)

  let insertados = 0
  let errores = 0

  for (const criterio of CRITERIOS_PENAL) {
    try {
      process.stdout.write(`   [${String(insertados + errores + 1).padStart(2, '0')}/${CRITERIOS_PENAL.length}] ${criterio.id} — `)

      const embedding = await generarEmbedding(criterio.contenido)

      const { error } = await supabase
        .from('criterios_juridicos')
        .upsert({
          id: criterio.id,
          contenido: criterio.contenido,
          instituto: criterio.instituto,
          subtipo: criterio.subtipo,
          jurisdiccion: criterio.jurisdiccion,
          alcance: criterio.alcance,
          criterio: criterio.criterio,
          regla_general: criterio.regla_general,
          articulos_cpp: criterio.articulos_cpp,
          nivel_autoridad: criterio.nivel_autoridad,
          data: criterio,
          embedding,
        }, { onConflict: 'id' })

      if (error) {
        console.log(`❌ Error: ${error.message}`)
        errores++
      } else {
        console.log('✅')
        insertados++
      }

      // Pausa para respetar rate limit de OpenAI (300ms entre requests)
      await new Promise(resolve => setTimeout(resolve, 300))

    } catch (err) {
      const mensaje = err instanceof Error ? err.message : String(err)
      console.log(`❌ Excepción: ${mensaje}`)
      errores++
    }
  }

  console.log(`\n=== Resultado ===`)
  console.log(`   ✅ Insertados: ${insertados}`)
  console.log(`   ❌ Errores:    ${errores}`)

  if (errores === 0) {
    console.log('\n✅ Corpus penal cargado correctamente. Listo para deploy.')
  } else {
    console.log('\n⚠️  Hubo errores. Revisar los criterios fallidos y volver a ejecutar.')
    console.log('   El script es idempotente: los criterios ya cargados no se duplican.')
  }
}

main().catch(console.error)
