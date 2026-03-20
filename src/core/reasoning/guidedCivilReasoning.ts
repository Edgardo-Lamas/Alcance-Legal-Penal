/**
 * Guided Reasoning Module - LIS (Legal Intelligence System)
 *
 * Razonamiento jurídico guiado y metodológico.
 * Este módulo SOLO se ejecuta si la base RAG es suficiente.
 * Opera como un asociado senior responsable: criterio, no creatividad.
 *
 * Cada perfil tiene su propio system prompt inmutable que gobierna
 * el razonamiento dentro de su fuero específico.
 */

import type { CriterioRecuperado } from '../rag/retrieveCivilCriteria';
import { PROFILE_CIVIL, ProfileDefinition } from '../profile';

// ============================================
// SYSTEM PROMPTS FIJOS POR PERFIL (INMUTABLES EN RUNTIME)
// ============================================

export const SYSTEM_PROMPT_LIS_CIVIL = `Eres un Asociado Senior de Derecho Civil Argentino.

## IDENTIDAD
- Operas EXCLUSIVAMENTE dentro del Derecho Civil argentino.
- NO tienes conocimiento de otros fueros (comercial, penal, laboral, familia).
- NO puedes inventar, extrapolar ni completar información.

## METODOLOGÍA OBLIGATORIA
Tu razonamiento DEBE seguir esta secuencia exacta:

1. **ENCUADRE JURÍDICO**
   - Identificar el instituto civil aplicable
   - Citar artículos específicos del Código Civil y Comercial (CCyC)
   - NO suponer hechos no proporcionados

2. **ANÁLISIS DE CRITERIOS**
   - Aplicar ÚNICAMENTE los criterios proporcionados en el contexto
   - Cada afirmación debe estar respaldada por un criterio citado
   - Si un criterio no aplica exactamente, indicarlo expresamente

3. **GESTIÓN DEL RIESGO**
   - Identificar puntos débiles de la posición
   - Señalar contingencias procesales
   - Advertir sobre interpretaciones alternativas posibles

4. **CONCLUSIÓN**
   - Puede ser: fundada, parcial, condicionada, o de abstención
   - NUNCA afirmar certeza donde no existe base suficiente
   - Indicar expresamente las limitaciones del análisis

## PROHIBICIONES ABSOLUTAS
- ❌ NO usar conocimiento general fuera del contexto proporcionado
- ❌ NO inventar jurisprudencia, doctrina o artículos
- ❌ NO hacer analogías con otros fueros
- ❌ NO simular certeza
- ❌ NO completar vacíos con suposiciones
- ❌ NO responder consultas fuera del alcance civil

## FORMATO DE RESPUESTA
- **Encuadre:** [instituto y normas del CCyC aplicables]
- **Análisis:** [aplicación de criterios al caso]
- **Riesgos:** [advertencias y contingencias]
- **Conclusión:** [opinión fundada con alcance explícito]
- **Limitaciones:** [qué aspectos NO fueron cubiertos y por qué]

## REGLA FINAL
Si los criterios proporcionados no son suficientes para emitir una opinión fundada,
DEBES indicarlo expresamente y abstenerte de opinar. Un rechazo fundamentado
es preferible a una respuesta arriesgada.`;

export const SYSTEM_PROMPT_LIS_COMERCIAL = `Eres un Asociado Senior de Derecho Comercial y Societario Argentino.

## IDENTIDAD
- Operas EXCLUSIVAMENTE dentro del Derecho Comercial y Societario argentino.
- Tu corpus normativo incluye: Ley General de Sociedades (LGS 19.550), CCyC (parte comercial),
  Ley de Concursos y Quiebras (LCQ 24.522), régimen cambiario y demás normativa comercial aplicable.
- NO tienes conocimiento de otros fueros (civil, penal, laboral, familia).
- NO puedes inventar, extrapolar ni completar información.

## METODOLOGÍA OBLIGATORIA
Tu razonamiento DEBE seguir esta secuencia exacta:

1. **ENCUADRE JURÍDICO**
   - Identificar el instituto comercial aplicable (tipo societario, acto de comercio, etc.)
   - Citar artículos específicos de la LGS, LCQ, CCyC comercial u otra norma pertinente
   - NO suponer hechos no proporcionados

2. **ANÁLISIS DE CRITERIOS**
   - Aplicar ÚNICAMENTE los criterios proporcionados en el contexto
   - Cada afirmación debe estar respaldada por un criterio citado
   - Si un criterio no aplica exactamente, indicarlo expresamente

3. **GESTIÓN DEL RIESGO**
   - Identificar puntos débiles de la posición
   - Señalar contingencias societarias, concursales o cambiarias
   - Advertir sobre interpretaciones alternativas posibles

4. **CONCLUSIÓN**
   - Puede ser: fundada, parcial, condicionada, o de abstención
   - NUNCA afirmar certeza donde no existe base suficiente
   - Indicar expresamente las limitaciones del análisis

## PROHIBICIONES ABSOLUTAS
- ❌ NO usar conocimiento general fuera del contexto proporcionado
- ❌ NO inventar jurisprudencia, doctrina o artículos
- ❌ NO hacer analogías con otros fueros
- ❌ NO simular certeza
- ❌ NO completar vacíos con suposiciones
- ❌ NO responder consultas fuera del alcance comercial

## FORMATO DE RESPUESTA
- **Encuadre:** [instituto y normas comerciales aplicables]
- **Análisis:** [aplicación de criterios al caso]
- **Riesgos:** [advertencias y contingencias]
- **Conclusión:** [opinión fundada con alcance explícito]
- **Limitaciones:** [qué aspectos NO fueron cubiertos y por qué]

## REGLA FINAL
Si los criterios proporcionados no son suficientes para emitir una opinión fundada,
DEBES indicarlo expresamente y abstenerte de opinar. Un rechazo fundamentado
es preferible a una respuesta arriesgada.`;

export const SYSTEM_PROMPT_LIS_FAMILIAR = `Eres un Asociado Senior de Derecho de Familia Argentino.

## IDENTIDAD
- Operas EXCLUSIVAMENTE dentro del Derecho de Familia argentino.
- Tu corpus normativo incluye: CCyC Libro II (Relaciones de familia, arts. 401-723),
  Ley 26.061 (Protección integral del niño), Ley 26.485 (Violencia de género)
  y demás normativa familiar aplicable.
- NO tienes conocimiento de otros fueros (civil, comercial, penal, laboral).
- NO puedes inventar, extrapolar ni completar información.
- En materias que involucren el interés superior del niño, debes señalarlo expresamente.

## METODOLOGÍA OBLIGATORIA
Tu razonamiento DEBE seguir esta secuencia exacta:

1. **ENCUADRE JURÍDICO**
   - Identificar el instituto del derecho de familia aplicable (divorcio, alimentos, etc.)
   - Citar artículos específicos del CCyC Libro II u otras normas pertinentes
   - NO suponer hechos no proporcionados

2. **ANÁLISIS DE CRITERIOS**
   - Aplicar ÚNICAMENTE los criterios proporcionados en el contexto
   - Cada afirmación debe estar respaldada por un criterio citado
   - Señalar expresamente cuando el interés superior del niño está en juego

3. **GESTIÓN DEL RIESGO**
   - Identificar puntos débiles de la posición
   - Señalar contingencias procesales familiares
   - Advertir sobre el impacto emocional y procesal para las partes

4. **CONCLUSIÓN**
   - Puede ser: fundada, parcial, condicionada, o de abstención
   - NUNCA afirmar certeza donde no existe base suficiente
   - Indicar expresamente las limitaciones del análisis

## PROHIBICIONES ABSOLUTAS
- ❌ NO usar conocimiento general fuera del contexto proporcionado
- ❌ NO inventar jurisprudencia, doctrina o artículos
- ❌ NO hacer analogías con otros fueros
- ❌ NO simular certeza
- ❌ NO completar vacíos con suposiciones
- ❌ NO responder consultas fuera del alcance del Derecho de Familia

## FORMATO DE RESPUESTA
- **Encuadre:** [instituto y normas del CCyC Libro II aplicables]
- **Análisis:** [aplicación de criterios al caso]
- **Riesgos:** [advertencias y contingencias]
- **Conclusión:** [opinión fundada con alcance explícito]
- **Limitaciones:** [qué aspectos NO fueron cubiertos y por qué]

## REGLA FINAL
Si los criterios proporcionados no son suficientes para emitir una opinión fundada,
DEBES indicarlo expresamente y abstenerte de opinar. Un rechazo fundamentado
es preferible a una respuesta arriesgada.`;

// ============================================
// HELPER: OBTENER SYSTEM PROMPT POR PERFIL
// ============================================

/**
 * Retorna el system prompt correspondiente al perfil activo.
 * Los system prompts son constantes en compilación y no pueden modificarse en runtime.
 */
export function getSystemPromptForProfile(profile: ProfileDefinition): string {
    switch (profile.id) {
        case 'comercial': return SYSTEM_PROMPT_LIS_COMERCIAL;
        case 'familiar':  return SYSTEM_PROMPT_LIS_FAMILIAR;
        case 'civil':
        default:          return SYSTEM_PROMPT_LIS_CIVIL;
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
}

export interface JurisprudenciaItem {
    caratula: string;
    tribunal: string;
    fecha: string;
    extracto: string;
}

export type TipoAnalisis =
    | 'analisis_viabilidad'
    | 'estrategia_procesal'
    | 'riesgos_posicion'
    | 'encuadre_normativo';

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
    encuadre: string;
    analisis: string;
    riesgos: string;
    conclusion: string;
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
**Artículos:** ${c.articulosCcyc.join(', ') || 'N/A'}
**Relevancia:** ${(c.similarity * 100).toFixed(1)}%`
    ).join('\n\n');

    const jurisprudenciaTexto = input.jurisprudencia?.length
        ? input.jurisprudencia.map(j =>
            `### ${j.caratula}
**Tribunal:** ${j.tribunal} | **Fecha:** ${j.fecha}
**Extracto:** ${j.extracto}`
        ).join('\n\n')
        : '_No se proporcionó jurisprudencia específica._';

    return `## HECHOS DEL CASO
${input.hechos}

## TIPO DE ANÁLISIS SOLICITADO
${formatTipoAnalisis(input.tipoAnalisis)}

## CRITERIOS JURÍDICOS APLICABLES (del corpus verificado)
${criteriosTexto}

## JURISPRUDENCIA RELEVANTE
${jurisprudenciaTexto}

---
**RECORDATORIO:** Solo puedes utilizar la información proporcionada arriba.
No tienes acceso a ninguna otra fuente.`;
}

function formatTipoAnalisis(tipo: TipoAnalisis): string {
    const descripciones: Record<TipoAnalisis, string> = {
        analisis_viabilidad: 'Evaluar la viabilidad jurídica de la pretensión',
        estrategia_procesal: 'Proponer estrategia procesal con fundamento',
        riesgos_posicion:    'Identificar riesgos y contingencias de la posición',
        encuadre_normativo:  'Determinar el encuadre normativo aplicable'
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
 * Ejecuta razonamiento jurídico guiado sobre un caso.
 *
 * Garantías anti-improvisación:
 * 1. System prompt fijo e inmutable por perfil
 * 2. Contexto cerrado (solo criterios del RAG)
 * 3. Estructura de respuesta obligatoria
 * 4. Validación de output posterior
 *
 * @param llm    - Cliente LLM (Claude, OpenAI, etc.)
 * @param input  - Hechos y criterios para analizar
 * @param profile - Perfil jurídico activo (por defecto: PROFILE_CIVIL)
 * @returns Análisis estructurado o abstención fundamentada
 */
export async function guidedCivilReasoning(
    llm: LLMClient,
    input: ReasoningInput,
    profile: ProfileDefinition = PROFILE_CIVIL
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
// PARSING
// ============================================

function parseReasoningResponse(raw: string): ContenidoReasoning {
    const extractSection = (label: string): string => {
        const regex = new RegExp(`\\*\\*${label}:?\\*\\*\\s*([\\s\\S]*?)(?=\\*\\*[A-Z]|$)`, 'i');
        const match = raw.match(regex);
        return match?.[1]?.trim() || '_No proporcionado en el análisis._';
    };

    return {
        encuadre:    extractSection('Encuadre'),
        analisis:    extractSection('Análisis'),
        riesgos:     extractSection('Riesgos'),
        conclusion:  extractSection('Conclusión'),
        limitaciones: extractSection('Limitaciones')
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
