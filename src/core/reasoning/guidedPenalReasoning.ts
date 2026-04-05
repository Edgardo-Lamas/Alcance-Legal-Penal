/**
 * Guided Reasoning Module - LIS Penal (Legal Intelligence System)
 *
 * Razonamiento jurídico-penal guiado y metodológico, perspectiva defensiva.
 * Este módulo SOLO se ejecuta si la base RAG es suficiente.
 * Opera desde la óptica del defensor: criterio, no creatividad.
 *
 * El system prompt es inmutable en runtime y gobierna toda la lógica de
 * razonamiento dentro del fuero penal (CPP PBA / Código Penal).
 */

import type { CriterioRecuperado } from '../rag/retrievePenalCriteria';
import { PROFILE_PENAL_PBA, ProfileDefinition, ActoJuridico } from '../profile';

// ============================================
// SYSTEM PROMPT — PENAL PBA (INMUTABLE EN RUNTIME)
// ============================================
//
// ⚠️  FUENTE AUTORITATIVA: supabase/functions/_shared/profile-config.ts
//     Este prompt es la referencia para el módulo frontend (testing/local).
//     El prompt de producción está en profile-config.ts y puede diferir.
//     Cualquier cambio sustancial debe replicarse en AMBOS archivos.
// ============================================

export const SYSTEM_PROMPT_LIS_PENAL_PBA = `Sos un Asociado Senior en Derecho Penal Argentino, especializado en DEFENSA.
Tu función es asistir al abogado defensor: analizás causas desde la perspectiva del imputado, nunca desde la acusación.

## IDENTIDAD
- Operás EXCLUSIVAMENTE en Derecho Penal y Procesal Penal argentino (CPP PBA Ley 11.922, Código Penal).
- Tu perspectiva es siempre defensiva: identificás las debilidades de la acusación, no sus fortalezas.
- NO tenés conocimiento de otros fueros (civil, comercial, laboral, familia).
- NO podés inventar, extrapolar ni completar información fuera del contexto proporcionado.

## PRINCIPIOS RECTORES IRRENUNCIABLES
1. **In dubio pro reo** — La duda razonable beneficia al imputado. Siempre.
2. **Presunción de inocencia** — El imputado es inocente hasta sentencia firme.
3. **Carga de la prueba** — Corresponde EXCLUSIVAMENTE a la acusación.
4. **Debido proceso** — Toda violación a garantías procesales es argumento defensivo.
5. **Non bis in idem** — Nadie puede ser juzgado dos veces por el mismo hecho.

## METODOLOGÍA OBLIGATORIA
Tu análisis DEBE seguir esta secuencia exacta:

1. **Encuadre Procesal:**
   - Identificar la etapa procesal, el delito imputado y las normas aplicables (CP / CPP PBA)
   - Señalar el estándar probatorio requerido para esa causa
   - NO suponer hechos no proporcionados

2. **Análisis de Prueba de Cargo:**
   - Examinar críticamente la evidencia de la acusación
   - Identificar debilidades, inconsistencias y falta de corroboración
   - Verificar la validez formal de cada elemento (cadena de custodia, peritos, testimonios)

3. **Nulidades y Vicios:**
   - Detectar irregularidades procesales (allanamientos, notificaciones, plazos)
   - Identificar prueba obtenida ilícitamente y aplicar doctrina de exclusión
   - Señalar violaciones a garantías constitucionales

4. **Conclusión Defensiva:**
   - Formular la posición defensiva con fundamento normativo concreto
   - Puede ser: absolución por duda, nulidad, sobreseimiento, reducción de calificación, o abstención
   - NUNCA afirmar certeza donde no existe base suficiente
   - Indicar expresamente las limitaciones del análisis

5. **Limitaciones:**
   - Qué aspectos NO fueron cubiertos y por qué

## PROHIBICIONES ABSOLUTAS
- ❌ NO razonés desde la perspectiva de la acusación
- ❌ NO asumas que el imputado es culpable
- ❌ NO omitas nulidades que favorezcan a la defensa
- ❌ NO uses conocimiento fuera del contexto proporcionado
- ❌ NO inventes jurisprudencia, doctrina ni artículos
- ❌ NO simules certeza donde existe duda
- ❌ NO respondas consultas fuera del fuero penal

## FORMATO DE RESPUESTA OBLIGATORIO
- **Encuadre Procesal:** [etapa, delito imputado, normas aplicables del CP / CPP PBA]
- **Análisis de Prueba de Cargo:** [evaluación crítica de la evidencia de la acusación]
- **Nulidades y Vicios:** [irregularidades procesales y garantías constitucionales violadas]
- **Conclusión Defensiva:** [posición fundada, con alcance y limitaciones explícitas]
- **Limitaciones:** [qué aspectos no fueron cubiertos y por qué]

## REGLA FINAL
Si los criterios proporcionados no son suficientes para emitir una opinión fundada,
indicalo expresamente y abstente de opinar. Un rechazo fundamentado es preferible
a una respuesta arriesgada. La abstención metódica también protege al imputado.`;

// ============================================
// HELPER: OBTENER SYSTEM PROMPT POR PERFIL
// ============================================

/**
 * Retorna el system prompt correspondiente al perfil activo.
 * Constante en compilación — no puede modificarse en runtime.
 */
export function getSystemPromptForProfile(profile: ProfileDefinition): string {
    switch (profile.id) {
        case 'penal_pba':
        default:
            return SYSTEM_PROMPT_LIS_PENAL_PBA;
    }
}

// ============================================
// TIPOS
// ============================================

export interface ReasoningInput {
    /** Descripción de los hechos del caso */
    hechos: string;
    /** Criterios jurídicos recuperados del RAG */
    criterios: CriterioRecuperado[];
    /** Jurisprudencia relevante (opcional) */
    jurisprudencia?: JurisprudenciaItem[];
    /** Tipo de análisis solicitado */
    tipoAnalisis: TipoAnalisis;
    /** Etapa procesal (opcional, enriquece el contexto) */
    etapaProcesal?: string;
    /** Prueba presentada por la acusación (opcional) */
    pruebaAcusacion?: string;
    /** Pretensión defensiva (opcional) */
    pretensionDefensiva?: string;
}

export interface JurisprudenciaItem {
    caratula: string;
    tribunal: string;
    fecha: string;
    extracto: string;
}

/** Alineado con ActoJuridico del perfil penal */
export type TipoAnalisis = ActoJuridico;

export interface ReasoningOutput {
    completado: boolean;
    tipoConclusion: TipoConclusionReasoning;
    contenido: ContenidoReasoning;
    metadata: ReasoningMetadata;
}

export type TipoConclusionReasoning =
    | 'ANALISIS_FUNDADO'
    | 'ANALISIS_PARCIAL'
    | 'ANALISIS_CONDICIONADO'
    | 'ABSTENCION_METODOLOGICA'
    | 'LIMITACION_EXPRESA';

export interface ContenidoReasoning {
    /** Encuadre procesal: etapa, delito, normas */
    encuadre: string;
    /** Análisis crítico de la prueba de cargo */
    analisis: string;
    /** Nulidades y vicios procesales detectados */
    riesgos: string;
    /** Conclusión defensiva fundada */
    conclusion: string;
    /** Aspectos no cubiertos */
    limitaciones: string;
}

export interface ReasoningMetadata {
    criteriosUtilizados: number;
    jurisprudenciaUtilizada: number;
    tipoAnalisis: TipoAnalisis;
    perfilId: string;
    timestamp: string;
}

// ============================================
// PREPARACIÓN DEL CONTEXTO (para el LLM)
// ============================================

export function buildReasoningContext(input: ReasoningInput): string {
    const criteriosTexto = input.criterios.map(c =>
        `### Criterio: ${c.criterio} (${c.id})
**Regla:** ${c.reglaGeneral}
**Normas:** ${c.articulosCpp.join(', ') || 'N/A'}
**Relevancia:** ${(c.similarity * 100).toFixed(1)}%`
    ).join('\n\n');

    const jurisprudenciaTexto = input.jurisprudencia?.length
        ? input.jurisprudencia.map(j =>
            `### ${j.caratula}
**Tribunal:** ${j.tribunal} | **Fecha:** ${j.fecha}
**Extracto:** ${j.extracto}`
        ).join('\n\n')
        : '_No se proporcionó jurisprudencia específica._';

    const contextoPenal = [
        input.etapaProcesal ? `**Etapa procesal:** ${input.etapaProcesal}` : null,
        input.pruebaAcusacion ? `**Prueba de la acusación:** ${input.pruebaAcusacion}` : null,
        input.pretensionDefensiva ? `**Pretensión defensiva:** ${input.pretensionDefensiva}` : null
    ].filter(Boolean).join('\n');

    return `## HECHOS DEL CASO
${input.hechos}
${contextoPenal ? `\n## CONTEXTO PROCESAL\n${contextoPenal}` : ''}

## TIPO DE ANÁLISIS SOLICITADO
${formatTipoAnalisis(input.tipoAnalisis)}

## CRITERIOS JURÍDICO-PENALES APLICABLES (corpus verificado)
${criteriosTexto}

## JURISPRUDENCIA RELEVANTE
${jurisprudenciaTexto}

---
**RECORDATORIO:** Solo podés utilizar la información proporcionada arriba.
No tenés acceso a ninguna otra fuente. Razonás exclusivamente desde la perspectiva de la DEFENSA.`;
}

function formatTipoAnalisis(tipo: TipoAnalisis): string {
    const descripciones: Record<TipoAnalisis, string> = {
        analizar_caso:              'Análisis defensivo integral del caso penal',
        analizar_prueba:            'Análisis crítico de la prueba de cargo presentada por la acusación',
        detectar_nulidades:         'Detección de nulidades e irregularidades procesales',
        contraargumentar_acusacion: 'Contraargumentación de los fundamentos de la acusación',
        revisar_estrategia:         'Revisión y ajuste de la estrategia defensiva'
    };
    return descripciones[tipo];
}

// ============================================
// INTERFAZ DE LLM
// ============================================

export interface LLMClient {
    chat: (params: {
        system: string;
        messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    }) => Promise<{ content: string }>;
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

/**
 * Ejecuta razonamiento jurídico-penal guiado sobre un caso.
 *
 * Garantías anti-improvisación:
 * 1. System prompt fijo e inmutable (perspectiva defensiva)
 * 2. Contexto cerrado (solo criterios del RAG)
 * 3. Estructura de respuesta obligatoria (5 secciones penales)
 * 4. Validación de output posterior
 *
 * @param llm     - Cliente LLM (Claude, OpenAI, etc.)
 * @param input   - Hechos y criterios para analizar
 * @param profile - Perfil jurídico activo (por defecto: PROFILE_PENAL_PBA)
 * @returns Análisis defensivo estructurado o abstención fundamentada
 */
export async function guidedPenalReasoning(
    llm: LLMClient,
    input: ReasoningInput,
    profile: ProfileDefinition = PROFILE_PENAL_PBA
): Promise<ReasoningOutput> {
    const timestamp = new Date().toISOString();
    const systemPrompt = getSystemPromptForProfile(profile);
    const context = buildReasoningContext(input);

    const response = await llm.chat({
        system: systemPrompt,
        messages: [{ role: 'user', content: context }]
    });

    const contenido = parseReasoningResponse(response.content);
    const tipoConclusion = determinarTipoConclusion(contenido);

    return {
        completado: tipoConclusion !== 'ABSTENCION_METODOLOGICA',
        tipoConclusion,
        contenido,
        metadata: {
            criteriosUtilizados: input.criterios.length,
            jurisprudenciaUtilizada: input.jurisprudencia?.length ?? 0,
            tipoAnalisis: input.tipoAnalisis,
            perfilId: profile.id,
            timestamp
        }
    };
}

// ============================================
// PARSING DE RESPUESTA PENAL
// ============================================

function parseReasoningResponse(raw: string): ContenidoReasoning {
    const FALLBACK = '_No proporcionado en el análisis._';

    // Intento 1: parsear como JSON (formato preferido del system prompt)
    try {
        const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
        const parsed = JSON.parse(cleaned)
        if (parsed && typeof parsed === 'object') {
            return {
                encuadre:     parsed.encuadre_procesal    || parsed.encuadre    || FALLBACK,
                analisis:     parsed.analisis_prueba_cargo || parsed.analisis    || FALLBACK,
                riesgos:      parsed.nulidades_y_vicios   || parsed.riesgos     || FALLBACK,
                conclusion:   parsed.conclusion_defensiva || parsed.conclusion  || FALLBACK,
                limitaciones: parsed.limitaciones                               || FALLBACK,
            }
        }
    } catch {
        // No es JSON — intentar con regex como fallback
    }

    // Intento 2: regex sobre markdown estructurado (fallback)
    const extractSection = (label: string): string => {
        const regex = new RegExp(`\\*\\*${label}:?\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*[A-ZÁÉÍÓÚÑ]|$)`, 'i');
        const match = raw.match(regex);
        return match?.[1]?.trim() || FALLBACK;
    };

    return {
        encuadre:     extractSection('Encuadre Procesal'),
        analisis:     extractSection('Análisis de Prueba de Cargo'),
        riesgos:      extractSection('Nulidades y Vicios'),
        conclusion:   extractSection('Conclusión Defensiva'),
        limitaciones: extractSection('Limitaciones'),
    };
}

function determinarTipoConclusion(contenido: ContenidoReasoning): TipoConclusionReasoning {
    const conclusionLower = contenido.conclusion.toLowerCase();

    if (conclusionLower.includes('abstenerse') || conclusionLower.includes('no es posible opinar')) {
        return 'ABSTENCION_METODOLOGICA';
    }
    if (conclusionLower.includes('condicionado') || conclusionLower.includes('sujeto a')) {
        return 'ANALISIS_CONDICIONADO';
    }
    if (conclusionLower.includes('parcial') || conclusionLower.includes('limitado a')) {
        return 'ANALISIS_PARCIAL';
    }
    if (contenido.limitaciones.length > 50) {
        return 'LIMITACION_EXPRESA';
    }
    return 'ANALISIS_FUNDADO';
}

// ============================================
// EXPORTS PARA TESTING
// ============================================

export const _internals = {
    buildReasoningContext,
    parseReasoningResponse,
    determinarTipoConclusion,
    formatTipoAnalisis,
    getSystemPromptForProfile
};
