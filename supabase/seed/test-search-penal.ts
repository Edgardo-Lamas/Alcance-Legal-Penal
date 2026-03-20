/**
 * Test de búsqueda semántica post-ingesta — Penal PBA
 *
 * Verifica que el RAG devuelve resultados relevantes para consultas reales
 * del perfil de defensa penal. Ejecutar después de seed-penal.ts.
 *
 * Uso:
 *   deno run --allow-net --allow-env --allow-read \
 *     --env-file=.env.penal \
 *     supabase/seed/test-search-penal.ts
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

// Consultas de prueba — deben matchear con criterios conocidos del corpus
const CONSULTAS_TEST = [
  {
    query: 'No hay pruebas suficientes para condenar, solo el testimonio de la denunciante sin ninguna corroboración objetiva',
    esperado: 'PN-TU-001',
    descripcion: 'Testimonio único — requisitos de suficiencia',
  },
  {
    query: 'La acusación invoca perspectiva de género para presumir la culpabilidad del imputado sin probar los hechos',
    esperado: 'PN-PG-001',
    descripcion: 'Perspectiva de género — límites constitucionales',
  },
  {
    query: 'El imputado lleva tres años detenido sin juicio, la prisión preventiva se prolongó indefinidamente',
    esperado: 'PN-PP-002',
    descripcion: 'Prisión preventiva — plazo razonable',
  },
  {
    query: 'El allanamiento se hizo sin orden judicial y la prueba obtenida se pretende usar en el juicio',
    esperado: 'PN-NUL-001',
    descripcion: 'Prueba ilícita — fruto del árbol envenenado',
  },
  {
    query: 'La denunciante cambió su versión varias veces entre la denuncia inicial y la cámara Gesell',
    esperado: 'PN-TU-003',
    descripcion: 'Contradicción en el testimonio de cargo',
  },
  {
    query: 'El perito psicólogo dijo que hay indicadores de abuso pero no puede confirmarse el hecho',
    esperado: 'PN-PER-001',
    descripcion: 'Pericia psicológica forense — valor y límites',
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
  console.log('=== Test de búsqueda semántica — Corpus Penal PBA ===\n')

  // Total de criterios en DB
  const { count } = await supabase
    .from('criterios_juridicos')
    .select('*', { count: 'exact', head: true })
  console.log(`📊 Criterios en DB: ${count}\n`)

  let pasaron = 0

  for (const { query, esperado, descripcion } of CONSULTAS_TEST) {
    console.log(`🔍 ${descripcion}`)
    console.log(`   Query: "${query.substring(0, 70)}..."`)

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
    const matchEsperado = top.id === esperado
    const icon = matchEsperado ? '✅' : '⚠️ '

    console.log(`   ${icon} Top 1: ${top.id} (similarity: ${top.similarity.toFixed(3)})`)
    console.log(`      ${top.criterio}`)

    if (!matchEsperado) {
      console.log(`      Esperado: ${esperado}`)
    }

    if (data.length > 1) {
      console.log(`      Top 2: ${data[1].id} (${data[1].similarity.toFixed(3)}) — ${data[1].criterio.substring(0, 50)}`)
    }

    console.log('')
    if (matchEsperado) pasaron++
  }

  console.log(`=== Resultado: ${pasaron}/${CONSULTAS_TEST.length} queries con match exacto ===`)
  if (pasaron < CONSULTAS_TEST.length) {
    console.log('⚠️  Algunos resultados no matchearon exactamente.')
    console.log('   Verificar que los contenidos de los criterios estén bien orientados semánticamente.')
  } else {
    console.log('✅ Corpus penal funcionando correctamente. Listo para deploy.')
  }
}

main().catch(console.error)
