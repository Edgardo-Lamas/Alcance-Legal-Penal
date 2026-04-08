/**
 * Carga corpus_penal_v1.json a Supabase con embeddings
 * Alcance Legal — Corpus RAG Penal PBA
 *
 * REQUISITOS:
 *   npm install @supabase/supabase-js openai dotenv
 *   Variables de entorno: SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY
 *
 * USO:
 *   node supabase/scripts/cargar_corpus_penal.js
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Configuración ────────────────────────────────────────────────────────────
const SUPABASE_URL        = process.env.SUPABASE_URL        || 'TU_SUPABASE_URL';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'TU_SERVICE_KEY';
const OPENAI_API_KEY      = process.env.OPENAI_API_KEY      || 'TU_OPENAI_API_KEY';

const CORPUS_PATH = path.resolve(
    __dirname,
    '../../knowledge/jurisprudencia_publica/penal/corpus_penal_v1.json'
);

// ── Clientes ─────────────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai   = new OpenAI({ apiKey: OPENAI_API_KEY });

// ── Helpers ──────────────────────────────────────────────────────────────────

async function generarEmbedding(texto) {
    const res = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: texto,
    });
    return res.data[0].embedding;
}

/**
 * Construye el texto que se vectoriza — prioriza los campos más semánticamente ricos
 */
function construirTextoEmbedding(criterio) {
    const partes = [
        `Criterio: ${criterio.criterio}`,
        `Regla General: ${criterio.regla_general}`,
    ];

    if (criterio.aplicacion_practica) {
        partes.push(`Aplicación práctica: ${criterio.aplicacion_practica}`);
    }
    if (criterio.condiciones_aplicacion?.length) {
        partes.push(`Condiciones: ${criterio.condiciones_aplicacion.join('. ')}`);
    }
    if (criterio.exclusiones_comunes?.length) {
        partes.push(`Exclusiones: ${criterio.exclusiones_comunes.join('. ')}`);
    }
    if (criterio.riesgos_procesales?.length) {
        partes.push(`Riesgos: ${criterio.riesgos_procesales.join('. ')}`);
    }

    return partes.join('\n\n');
}

async function procesarCriterio(criterio, indice, total) {
    process.stdout.write(`  [${indice}/${total}] ${criterio.id}: ${criterio.criterio.substring(0, 60)}...\n`);

    const textoEmbedding = construirTextoEmbedding(criterio);
    const embedding = await generarEmbedding(textoEmbedding);

    const registro = {
        id:               criterio.id,
        contenido:        textoEmbedding,
        instituto:        criterio.instituto,
        subtipo:          criterio.subtipo,
        jurisdiccion:     criterio.jurisdiccion     || 'argentina_pba',
        alcance:          criterio.alcance          || 'criterios_generales',
        criterio:         criterio.criterio,
        regla_general:    criterio.regla_general,
        articulos_ccyc:   criterio.articulos_cpp    || [],   // columna genérica en tabla
        nivel_autoridad:  criterio.nivel_autoridad  || 'orientativo',
        data:             criterio,                          // JSON completo
        embedding:        embedding,
    };

    const { error } = await supabase
        .from('criterios_juridicos')
        .upsert(registro, { onConflict: 'id' })
        .select();

    if (error) {
        console.error(`    ✗ Error: ${error.message}`);
        return false;
    }

    console.log(`    ✓ OK`);
    return true;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  Carga Corpus RAG Penal PBA — corpus_penal_v1.json');
    console.log('  Alcance Legal Penal');
    console.log('═══════════════════════════════════════════════════════\n');

    if (SUPABASE_URL.includes('TU_') || OPENAI_API_KEY.includes('TU_')) {
        console.error('❌ ERROR: Configurar variables de entorno:');
        console.error('   SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY');
        process.exit(1);
    }

    if (!fs.existsSync(CORPUS_PATH)) {
        console.error(`❌ No se encontró el corpus en: ${CORPUS_PATH}`);
        process.exit(1);
    }

    const criterios = JSON.parse(fs.readFileSync(CORPUS_PATH, 'utf-8'));
    const total = criterios.length;
    console.log(`Corpus cargado: ${total} criterios\n`);

    let exitosos = 0;
    let errores  = 0;

    for (let i = 0; i < criterios.length; i++) {
        try {
            const ok = await procesarCriterio(criterios[i], i + 1, total);
            if (ok) exitosos++;
            else errores++;
        } catch (err) {
            console.error(`    ✗ Excepción: ${err.message}`);
            errores++;
        }

        // Pausa breve para no exceder rate limits de OpenAI
        await new Promise(r => setTimeout(r, 300));
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  RESUMEN');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  ✓ Cargados exitosamente: ${exitosos}`);
    console.log(`  ✗ Errores:               ${errores}`);
    console.log(`  Total:                   ${total}`);
    console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(console.error);
