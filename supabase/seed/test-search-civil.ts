/**
 * Test de búsqueda semántica post-ingesta — Civil
 *
 * Verifica que el RAG devuelve resultados relevantes para consultas reales.
 * Ejecutar después de seed-civil.ts para confirmar que el corpus funciona.
 *
 * Uso:
 *   deno run --allow-net --allow-env --allow-read \
 *     --env-file=.env.civil \
 *     supabase/seed/test-search-civil.ts
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
  console.error('❌ Variables de entorno faltantes.')
  Deno.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Consultas de prueba que deberían matchear con criterios conocidos
const CONSULTAS_TEST = [
  {
    query: 'El inquilino no paga el alquiler hace tres meses y quiero desalojarlo',
    esperado: 'LOC-',
  },
  {
    query: 'Me vendieron un auto con un defecto oculto que no me informaron, quiero recuperar el dinero',
    esperado: 'VR-',
  },
  {
    query: 'Un empleado de la empresa causó un accidente con el vehículo de la empresa',
    esperado: 'RC-EXT-004',
  },
  {
    query: 'El contratista no terminó la obra en el plazo acordado y me causó pérdidas',
    esperado: 'CT-INC-',
  },
]

async function generarEmbedding(texto: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'text-embedding-ada-002', input: texto }),
  })
  const data = await response.json()
  return data.data[0].embedding
}

async function main() {
  console.log('=== Test de búsqueda semántica — Corpus Civil ===\n')

  // Verificar total de criterios en DB
  const { count } = await supabase
    .from('criterios_juridicos')
    .select('*', { count: 'exact', head: true })
  console.log(`📊 Criterios en DB: ${count}\n`)

  let pasaron = 0

  for (const { query, esperado } of CONSULTAS_TEST) {
    console.log(`🔍 Query: "${query.substring(0, 60)}..."`)

    const embedding = await generarEmbedding(query)

    const { data, error } = await supabase.rpc('buscar_criterios', {
      query_embedding: embedding,
      match_count: 3,
      filter_alcance: 'criterios_generales',
    })

    if (error) {
      console.log(`   ❌ Error: ${error.message}\n`)
      continue
    }

    if (!data || data.length === 0) {
      console.log('   ❌ Sin resultados\n')
      continue
    }

    const top = data[0]
    const matchEsperado = top.id.startsWith(esperado)
    const icon = matchEsperado ? '✅' : '⚠️ '

    console.log(`   ${icon} Top 1: ${top.id} (similarity: ${top.similarity.toFixed(3)})`)
    console.log(`      ${top.criterio}`)

    if (data.length > 1) {
      console.log(`      Top 2: ${data[1].id} (${data[1].similarity.toFixed(3)}) — ${data[1].criterio.substring(0, 40)}`)
    }

    console.log('')
    if (matchEsperado) pasaron++
  }

  console.log(`=== Resultado: ${pasaron}/${CONSULTAS_TEST.length} queries con match esperado ===`)
  if (pasaron < CONSULTAS_TEST.length) {
    console.log('⚠️  Algunos resultados no matchearon con el criterio esperado.')
    console.log('   Esto puede indicar que el corpus necesita más criterios o que los textos deben refinarse.')
  } else {
    console.log('✅ Corpus funcionando correctamente. Listo para deploy.')
  }
}

main().catch(console.error)
