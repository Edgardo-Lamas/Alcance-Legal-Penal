/**
 * Test de búsqueda semántica — Corpus RAG Penal PBA
 * Alcance Legal Penal
 *
 * Ejecuta 3 búsquedas representativas y muestra los top-3 resultados con score.
 *
 * REQUISITOS:
 *   Variables de entorno: SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY
 *
 * USO:
 *   node supabase/scripts/test_corpus_penal.js
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// ── Configuración ────────────────────────────────────────────────────────────
const SUPABASE_URL         = process.env.SUPABASE_URL        || 'TU_SUPABASE_URL';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'TU_SERVICE_KEY';
const OPENAI_API_KEY       = process.env.OPENAI_API_KEY      || 'TU_OPENAI_API_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai   = new OpenAI({ apiKey: OPENAI_API_KEY });

// ── Búsquedas de prueba ───────────────────────────────────────────────────────
const BUSQUEDAS = [
    'allanamiento sin orden judicial flagrancia entrada domicilio',
    'tenencia estupefacientes comercialización prueba dolo',
    'nulidad absoluta exclusión probatoria acto irregular',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

async function generarEmbedding(texto) {
    const res = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: texto,
    });
    return res.data[0].embedding;
}

async function buscarCriterios(query, topK = 3) {
    const embedding = await generarEmbedding(query);

    const { data, error } = await supabase.rpc('match_criterios_juridicos', {
        query_embedding: embedding,
        match_threshold: 0.70,
        match_count: topK,
    });

    if (error) {
        // Fallback: consulta directa si la RPC no existe aún
        console.warn(`  ⚠ RPC no disponible (${error.message}), usando fallback directo`);
        const { data: rows, error: err2 } = await supabase
            .from('criterios_juridicos')
            .select('id, criterio, regla_general, instituto, nivel_autoridad')
            .limit(topK);

        if (err2) throw new Error(err2.message);
        return (rows || []).map(r => ({ ...r, similarity: null }));
    }

    return data || [];
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Test Búsqueda Semántica — Corpus RAG Penal PBA');
    console.log('  Alcance Legal Penal');
    console.log('═══════════════════════════════════════════════════════\n');

    if (SUPABASE_URL.includes('TU_') || OPENAI_API_KEY.includes('TU_')) {
        console.error('❌ ERROR: Configurar variables de entorno.');
        process.exit(1);
    }

    for (const query of BUSQUEDAS) {
        console.log(`\n🔍 BÚSQUEDA: "${query}"`);
        console.log('─'.repeat(60));

        try {
            const resultados = await buscarCriterios(query, 3);

            if (!resultados.length) {
                console.log('  (sin resultados — verificar que el corpus está cargado)');
                continue;
            }

            resultados.forEach((r, i) => {
                const score = r.similarity != null
                    ? ` [similarity: ${(r.similarity * 100).toFixed(1)}%]`
                    : '';
                console.log(`\n  ${i + 1}. ${r.id}${score}`);
                console.log(`     Instituto: ${r.instituto}`);
                console.log(`     Criterio:  ${r.criterio}`);
                if (r.regla_general) {
                    console.log(`     Regla:     ${r.regla_general.substring(0, 120)}...`);
                }
                console.log(`     Autoridad: ${r.nivel_autoridad}`);
            });
        } catch (err) {
            console.error(`  ✗ Error en búsqueda: ${err.message}`);
        }

        await new Promise(r => setTimeout(r, 500));
    }

    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('  Test completado');
    console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(console.error);
