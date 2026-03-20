/**
 * Shared Profile Configuration — Alcance Legal
 *
 * Fuente de verdad para los tres productos (Civil, Comercial, Familiar).
 * Archivo Deno-compatible: sin imports de Node/bundler.
 * Importar desde Edge Functions con ruta relativa: '../_shared/profile-config.ts'
 */

// ============================================
// TIPOS
// ============================================

export type ProfileId = 'civil' | 'comercial' | 'familiar';

export interface ProfileConfig {
  readonly id: ProfileId;
  /** Nombre completo del producto */
  readonly nombre: string;
  /** Prefijo para numeración de informes (ALC-{CODIGO}-...) */
  readonly codigoInforme: string;
  /** Fuero que este perfil atiende */
  readonly fueroAdmitido: string;
  /** Fueros que este perfil rechaza explícitamente */
  readonly fuerosExcluidos: readonly string[];
  /** Keywords que activan rechazo por fuero excluido */
  readonly fuerosExcluidosKeywords: readonly string[];
  /** Keywords que confirman que la consulta es del fuero correcto */
  readonly fueroAdmitidoKeywords: readonly string[];
  /** System prompt inmutable para el LLM */
  readonly systemPrompt: string;
  /** Texto del disclaimer del corpus en informes */
  readonly disclaimerCorpus: string;
  /** Mensajes de rechazo del pipeline */
  readonly politicaRechazo: {
    readonly mensajeFueraDeCompetencia: string;
    readonly mensajeHechosInsuficientes: string;
    readonly mensajeConsultaHibrida: string;
  };
}

// ============================================
// PERFIL: CIVIL
// ============================================

const SYSTEM_PROMPT_CIVIL = `Eres un Asociado Senior de Derecho Civil Argentino.

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

export const PROFILE_CIVIL_CONFIG: ProfileConfig = {
  id: 'civil',
  nombre: 'Alcance Legal – Civil',
  codigoInforme: 'CIVIL',
  fueroAdmitido: 'civil',
  fuerosExcluidos: ['comercial', 'penal', 'laboral', 'familia'],
  fuerosExcluidosKeywords: [
    // Penal
    'penal', 'delito', 'crimen', 'prisión', 'homicidio', 'robo', 'hurto', 'estafa',
    // Laboral
    'laboral', 'despido', 'lct', 'indemnización laboral', 'trabajo registrado',
    // Comercial
    'quiebra', 'concurso', 'sociedad anónima', 'cheque', 'pagaré',
    // Familia
    'divorcio', 'alimentos', 'tenencia', 'régimen de visitas', 'adopción',
    'responsabilidad parental', 'unión convivencial'
  ],
  fueroAdmitidoKeywords: [
    'contrato', 'daños', 'perjuicios', 'obligaciones', 'propiedad', 'sucesión',
    'locación', 'alquiler', 'responsabilidad civil', 'usucapión', 'hipoteca',
    'posesión', 'prescripción', 'nulidad', 'vicios redhibitorios'
  ],
  systemPrompt: SYSTEM_PROMPT_CIVIL,
  disclaimerCorpus: 'Los criterios citados corresponden al corpus Civil verificado (CCyC).',
  politicaRechazo: {
    mensajeFueraDeCompetencia:
      'Esta consulta corresponde a un fuero distinto al Civil. ' +
      'Alcance Legal – Civil opera exclusivamente dentro del Derecho Civil. ' +
      'No se admiten consultas de otros fueros ni analogías entre jurisdicciones.',
    mensajeHechosInsuficientes:
      'La consulta no contiene hechos suficientes para emitir una opinión fundada. ' +
      'Por favor, proporcione: partes involucradas, hechos relevantes y pretensión.',
    mensajeConsultaHibrida:
      'La consulta involucra aspectos de múltiples fueros. ' +
      'Este sistema solo puede operar sobre cuestiones estrictamente civiles. ' +
      'Reformule la consulta excluyendo los aspectos no civiles.'
  }
} as const;

// ============================================
// PERFIL: COMERCIAL
// ============================================

const SYSTEM_PROMPT_COMERCIAL = `Eres un Asociado Senior de Derecho Comercial y Societario Argentino.

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
DEBES indicarlo expresamente y abstenerse de opinar. Un rechazo fundamentado
es preferible a una respuesta arriesgada.`;

export const PROFILE_COMERCIAL_CONFIG: ProfileConfig = {
  id: 'comercial',
  nombre: 'Alcance Legal – Comercial',
  codigoInforme: 'COMERCIAL',
  fueroAdmitido: 'comercial',
  fuerosExcluidos: ['civil', 'penal', 'laboral', 'familia'],
  fuerosExcluidosKeywords: [
    // Penal
    'penal', 'delito', 'crimen', 'prisión', 'homicidio', 'robo', 'hurto',
    // Laboral
    'laboral', 'despido', 'lct', 'indemnización laboral',
    // Civil extracontractual
    'responsabilidad civil extracontractual', 'daño moral subjetivo',
    // Familia
    'divorcio', 'alimentos', 'tenencia', 'adopción', 'régimen de visitas',
    'responsabilidad parental', 'unión convivencial'
  ],
  fueroAdmitidoKeywords: [
    'sociedad', 'srl', 'sa', 'fideicomiso', 'leasing', 'concurso', 'quiebra',
    'accionista', 'directorio', 'cheque', 'pagaré', 'letra de cambio',
    'contrato comercial', 'fondo de comercio', 'marca', 'patente',
    'societario', 'lgs', 'lcq', 'receso', 'cuota parte', 'acción societaria'
  ],
  systemPrompt: SYSTEM_PROMPT_COMERCIAL,
  disclaimerCorpus: 'Los criterios citados corresponden al corpus Comercial verificado (LGS 19.550, LCQ 24.522, CCyC).',
  politicaRechazo: {
    mensajeFueraDeCompetencia:
      'Esta consulta corresponde a un fuero distinto al Comercial. ' +
      'Alcance Legal – Comercial opera exclusivamente dentro del Derecho Comercial y Societario. ' +
      'No se admiten consultas de otros fueros ni analogías entre jurisdicciones.',
    mensajeHechosInsuficientes:
      'La consulta no contiene hechos suficientes para emitir una opinión fundada. ' +
      'Por favor, proporcione: partes involucradas, hechos relevantes y pretensión.',
    mensajeConsultaHibrida:
      'La consulta involucra aspectos de múltiples fueros. ' +
      'Este sistema solo puede operar sobre cuestiones estrictamente comerciales. ' +
      'Reformule la consulta excluyendo los aspectos no comerciales.'
  }
} as const;

// ============================================
// PERFIL: FAMILIAR
// ============================================

const SYSTEM_PROMPT_FAMILIAR = `Eres un Asociado Senior de Derecho de Familia Argentino.

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

export const PROFILE_FAMILIAR_CONFIG: ProfileConfig = {
  id: 'familiar',
  nombre: 'Alcance Legal – Familiar',
  codigoInforme: 'FAMILIAR',
  fueroAdmitido: 'familia',
  fuerosExcluidos: ['civil', 'comercial', 'penal', 'laboral'],
  fuerosExcluidosKeywords: [
    // Penal
    'penal', 'delito', 'crimen', 'prisión', 'homicidio',
    // Laboral
    'laboral', 'despido', 'lct', 'indemnización laboral',
    // Comercial
    'sociedad', 'quiebra', 'concurso', 'cheque', 'pagaré', 'letra de cambio',
    'accionista', 'directorio', 'fideicomiso comercial',
    // Civil extracontractual puro
    'responsabilidad civil extracontractual', 'usucapión', 'hipoteca'
  ],
  fueroAdmitidoKeywords: [
    'divorcio', 'alimentos', 'tenencia', 'cuidado personal', 'adopción',
    'régimen de visitas', 'comunicación', 'unión convivencial',
    'responsabilidad parental', 'filiación', 'tutela', 'curatela',
    'violencia familiar', 'violencia de género', 'bien de familia',
    'interés superior', 'niño', 'adolescente', 'progenitor', 'cuota alimentaria'
  ],
  systemPrompt: SYSTEM_PROMPT_FAMILIAR,
  disclaimerCorpus: 'Los criterios citados corresponden al corpus Familiar verificado (CCyC Libro II, Ley 26.061, Ley 26.485).',
  politicaRechazo: {
    mensajeFueraDeCompetencia:
      'Esta consulta corresponde a un fuero distinto al de Familia. ' +
      'Alcance Legal – Familiar opera exclusivamente dentro del Derecho de Familia. ' +
      'No se admiten consultas de otros fueros ni analogías entre jurisdicciones.',
    mensajeHechosInsuficientes:
      'La consulta no contiene hechos suficientes para emitir una opinión fundada. ' +
      'Por favor, proporcione: partes involucradas, hechos relevantes y pretensión.',
    mensajeConsultaHibrida:
      'La consulta involucra aspectos de múltiples fueros. ' +
      'Este sistema solo puede operar sobre cuestiones estrictamente familiares. ' +
      'Reformule la consulta excluyendo los aspectos ajenos al Derecho de Familia.'
  }
} as const;

// ============================================
// REGISTRO DE PERFILES
// ============================================

export const PROFILES: Record<ProfileId, ProfileConfig> = {
  civil: PROFILE_CIVIL_CONFIG,
  comercial: PROFILE_COMERCIAL_CONFIG,
  familiar: PROFILE_FAMILIAR_CONFIG,
} as const;

/**
 * Obtiene la configuración de un perfil por su ID.
 * Lanza error si el ID no existe (fail-fast: nunca operar con perfil desconocido).
 */
export function getProfileConfig(id: ProfileId): ProfileConfig {
  const profile = PROFILES[id];
  if (!profile) throw new Error(`Perfil desconocido: ${id}`);
  return profile;
}
