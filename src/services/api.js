/**
 * Servicio de API para Alcance Legal Penal
 *
 * Maneja las comunicaciones con Supabase Edge Functions.
 * Endpoint principal: /analizar-caso (pipeline LIS penal completo)
 * Perspectiva: SIEMPRE desde la defensa. In dubio pro reo.
 */

import { supabase } from './supabase'

// Configuración de Supabase Edge Functions
const SUPABASE_CONFIG = {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    functionsUrl: import.meta.env.VITE_SUPABASE_URL ?
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1` : null
}

/**
 * Token para las Edge Functions: el access_token del abogado logueado.
 * Con REQUIRE_AUTH=true en producción, el anon key devuelve 401 — el fallback
 * solo aplica sin sesión (dev / mocks).
 */
async function getAuthToken() {
    if (supabase) {
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.access_token) return session.access_token
        } catch { /* sin sesión activa */ }
    }
    return SUPABASE_CONFIG.anonKey
}

// Configuración de endpoints n8n (legacy/fallback)
const N8N_CONFIG = {
    baseUrl: import.meta.env.VITE_N8N_BASE_URL || 'http://localhost:5678/webhook',
    endpoints: {
        analizar: '/analizar-caso',
        auditar: '/auditar-estrategia',
        redactar: '/redactar-escrito'
    },
    // Mocks SOLO si se activan explícitamente (VITE_USE_MOCKS=true)
    // Por defecto: producción real
    useMocks: import.meta.env.VITE_USE_MOCKS === 'true'
}

/**
 * Respuestas mockeadas para desarrollo (formato penal)
 */
const MOCK_RESPONSES = {
    analizar: {
        success: true,
        status: 'approved',
        data: {
            numero_informe: `ALC-PENAL-PBA-${new Date().getFullYear()}-000001`,
            fecha_emision: new Date().toISOString(),
            encuadre_procesal:
                'La causa se encuentra en etapa de Investigación Penal Preparatoria (IPP) bajo el CPP PBA (Ley 11.922). ' +
                'El tipo penal imputado exige para su configuración la acreditación de todos sus elementos constitutivos, ' +
                'cuya carga probatoria recae exclusivamente en la acusación (CN Art. 18; CADH Art. 8.2). ' +
                'La defensa técnica no tiene obligación de probar inocencia.',
            analisis_prueba_cargo:
                'La prueba de cargo presentada consiste principalmente en prueba testimonial. ' +
                'Para que el testimonio único sea suficiente para destruir la presunción de inocencia, la jurisprudencia del SCBA exige: ' +
                '(1) persistencia sin contradicciones relevantes; (2) ausencia de motivación espuria acreditada; ' +
                '(3) corroboración periférica objetiva —aunque sea parcial—; (4) verosimilitud intrínseca del relato. ' +
                'La ausencia o debilidad de alguno de estos elementos activa obligatoriamente el in dubio pro reo.',
            nulidades_y_vicios:
                'Se advierte la necesidad de examinar: (1) regularidad del procedimiento de obtención de prueba ' +
                'y cumplimiento de las formas sustanciales (CPP PBA Art. 202); (2) cumplimiento del deber de ' +
                'intimación de los hechos en términos claros y precisos (CPP PBA Art. 308); ' +
                '(3) vigencia del plazo razonable en la investigación (CADH Art. 8.1). ' +
                'Cualquier vicio en la obtención o incorporación de prueba puede generar nulidad relativa o absoluta.',
            contraargumentacion:
                'Los argumentos acusatorios presentan debilidades en la acreditación de los elementos objetivos del tipo. ' +
                'La defensa debe focalizar el análisis en: (1) identificar inconsistencias o contradicciones probatorias; ' +
                '(2) señalar los elementos constitutivos del delito no acreditados; ' +
                '(3) cuestionar la legalidad o la incorporación de cada elemento de prueba invocado. ' +
                'La existencia de duda razonable sobre cualquier elemento constitutivo activa el in dubio pro reo.',
            conclusion_defensiva:
                'En función del análisis, se recomienda explorar: sobreseimiento por insuficiencia probatoria ' +
                '(CPP PBA Art. 323 inc. 3) o por atipicidad de la conducta (inc. 1); ' +
                'en subsidio, nulidad de los actos procesales que presenten vicios formales. ' +
                'La estrategia definitiva requiere acceso al expediente completo.',
            limitaciones:
                'El análisis se basa exclusivamente en los hechos informados por el usuario. ' +
                'El acceso al expediente completo, las actas de procedimiento, la prueba documental ' +
                'y las declaraciones testimoniales permitiría un análisis más preciso. ' +
                'Factores procesales no declarados pueden alterar sustancialmente las conclusiones.'
        },
        advertencias: [],
        disclaimer: {
            version: '1.2-penal',
            texto: 'Este análisis es un insumo técnico de defensa penal. Razona exclusivamente desde la perspectiva defensiva. No constituye consejo legal definitivo.',
            advertencias: [
                'Este análisis NO constituye opinión legal ni consejo profesional.',
                'El sistema opera EXCLUSIVAMENTE desde la perspectiva de la defensa penal.',
                'La decisión estratégica corresponde exclusivamente al abogado defensor actuante.'
            ]
        },
        meta: {
            criterios_utilizados: 4,
            pipeline_version: '1.0-lis-penal_pba',
            timestamp: new Date().toISOString()
        }
    },

    auditar: {
        numero_informe: `ALC-AUD-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
        fecha_emision: new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' }),
        estado: 'DICTAMEN DE AUDITORÍA',
        estado_detalle: 'Requiere revisión de los puntos señalados',
        consistencia: {
            valor: 'PARCIAL',
            explicacion: 'La estrategia defensiva presenta una línea argumental principal sólida (nulidad del procedimiento de detención), pero contiene supuestos implícitos no validados que podrían comprometer su efectividad si la acusación los controvierte. El objetivo de sobreseimiento es alcanzable solo si la nulidad prospera; la estrategia carece de línea subsidiaria para el caso de que el planteo sea rechazado.',
            advertencia: 'Antes de avanzar con la presentación, refuerce la estrategia con una línea subsidiaria que no dependa exclusivamente del éxito del planteo de nulidad.'
        },
        observaciones: [
            {
                tipo: 'supuesto_implicito',
                codigo: 'OBS-001',
                descripcion: 'La estrategia asume que el tribunal acogerá el planteo de nulidad sin contemplar el escenario en que lo rechace.',
                impacto: 'Si la nulidad no prospera, la defensa queda sin argumentos para el fondo del caso. El objetivo de sobreseimiento no podría alcanzarse por la vía subsidiaria.',
                severidad: 'alta'
            },
            {
                tipo: 'riesgo_no_contemplado',
                codigo: 'OBS-002',
                descripcion: 'La estrategia no contempla la posibilidad de prueba independiente que no dependa de la detención cuestionada.',
                impacto: 'Si existe prueba obtenida por vía autónoma (doctrina del árbol envenenado — excepciones art. 211 CPP PBA), la exclusión solicitada podría ser parcial y no eliminar todos los elementos de cargo.',
                severidad: 'media'
            }
        ],
        recomendaciones: [
            {
                prioridad: 'alta',
                accion: 'Desarrollar una línea argumental subsidiaria sobre insuficiencia probatoria (art. 323 inc. 3 CPP PBA) para el caso en que el planteo de nulidad sea rechazado.'
            },
            {
                prioridad: 'alta',
                accion: 'Relevar si existe prueba de cargo independiente de la detención cuestionada y anticipar su tratamiento en la estrategia.'
            },
            {
                prioridad: 'media',
                accion: 'Incorporar al planteo de nulidad el análisis de la cadena de custodia de los elementos secuestrados, cuya regularidad está vinculada a la validez del procedimiento.'
            }
        ],
        advertencias: {
            principal: 'La auditoría evalúa consistencia lógica y detecta riesgos, no garantiza resultados procesales. La decisión final corresponde al profesional actuante.',
            items: [
                'Este dictamen evalúa coherencia interna de la estrategia, no el mérito del caso.',
                'Supuestos no declarados por el abogado pueden contener riesgos adicionales no identificados.',
                'La validación final requiere conocimiento completo del expediente.'
            ]
        }
    },

    redactar: {
        numero_informe: `ALC-RED-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
        fecha_emision: new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' }),
        estado: 'BORRADOR ASISTIDO',
        estado_detalle: 'Documento de trabajo — NO PRESENTAR sin revisión profesional',
        tipo_escrito: 'Excarcelación / Morigeración de Prisión Preventiva',
        contenido: `SOLICITA EXCARCELACIÓN — ART. 169 CPP PBA

Sr./Sra. Juez/a de Garantías:

[COMPLETAR: Nombre del letrado], abogado/a, T° [COMPLETAR] F° [COMPLETAR] del Colegio de Abogados del Departamento Judicial [COMPLETAR], constituyendo domicilio electrónico en [COMPLETAR] y domicilio procesal en [COMPLETAR], en representación de [COMPLETAR: nombre del imputado], a V.S. respetuosamente digo:

I. OBJETO
Que vengo a solicitar la EXCARCELACIÓN de mi asistido/a bajo caución [real/personal] conforme lo previsto por los arts. 169 y 189 del CPP PBA (Ley 11.922), por las razones de hecho y de derecho que a continuación expongo.

II. HECHOS Y ANTECEDENTES
[COMPLETAR: Narrar los hechos desde la perspectiva de la defensa, incluyendo: fecha de detención, imputación formulada, tiempo de detención transcurrido, situación personal del imputado]

III. DERECHO
El art. 169 del CPP PBA establece que la excarcelación procederá cuando no concurran los peligros procesales previstos en el art. 157.

Los peligros procesales del art. 157 CPP PBA (peligro de fuga y peligro de entorpecimiento de la investigación) NO se verifican en autos por las siguientes razones:

Respecto del peligro de fuga: mi asistido/a cuenta con [COMPLETAR: arraigo —domicilio fijo, trabajo, núcleo familiar—], lo que descarta objetivamente la posibilidad de sustracción al proceso (arts. 148 y 157 CPP PBA).

Respecto del peligro de entorpecimiento: [COMPLETAR: razones por las que no existe riesgo de entorpecimiento — etapa procesal, prueba ya colectada, etc.]

IV. PETITORIO
Por todo lo expuesto, a V.S. solicito:
1. Se tenga por presentado el presente escrito.
2. Se OTORGUE la excarcelación de [COMPLETAR: nombre] bajo caución [real/personal] de PESOS [COMPLETAR: monto] (arts. 169 y 189 CPP PBA).
3. Oportunamente, se haga lugar a lo solicitado con costas.

Proveer de conformidad será justicia.`,
        secciones_pendientes: [
            {
                seccion: 'Identificación del letrado',
                motivo: 'Completar T°, F°, Colegio, domicilios electrónico y procesal',
                criticidad: 'alta'
            },
            {
                seccion: 'II. HECHOS Y ANTECEDENTES',
                motivo: 'Narrar los hechos del caso: detención, imputación, tiempo transcurrido',
                criticidad: 'alta'
            },
            {
                seccion: 'III. DERECHO — Arraigo',
                motivo: 'Detallar domicilio, ocupación laboral y núcleo familiar del imputado',
                criticidad: 'alta'
            },
            {
                seccion: 'IV. PETITORIO — Caución',
                motivo: 'Definir tipo y monto de la caución propuesta',
                criticidad: 'media'
            }
        ],
        advertencias: {
            principal: 'ADVERTENCIA CRÍTICA: Este documento es un BORRADOR DE TRABAJO generado por asistencia automatizada. Su presentación judicial sin revisión profesional completa del letrado constituye ejercicio inadecuado de la profesión.',
            items: [
                'El letrado firmante asume responsabilidad exclusiva por el contenido presentado.',
                'Verificar datos del imputado, juzgado y número de causa antes de cualquier uso.',
                'Las citas normativas deben validarse contra el CPP PBA vigente (Ley 11.922).',
                'El estilo y estructura pueden requerir ajustes según la práctica del juzgado interviniente.'
            ]
        }
    },

    consultor: {
        success: true,
        respuesta:
            'Sobre la base del informe de esta causa, podría plantearse la nulidad del procedimiento ' +
            'antes que la excarcelación: si prospera (arts. 201-207 CPP PBA), la exclusión de la prueba ' +
            'obtenida debilita la base de la prisión preventiva y la excarcelación (arts. 169 y 189 CPP PBA) ' +
            'gana viabilidad como planteo subsidiario. El riesgo de invertir el orden es consolidar la ' +
            'valoración de una prueba cuya legalidad aún no fue cuestionada. Esto requiere verificar en el ' +
            'expediente el acta del procedimiento y su cadena de custodia.',
        criterios_utilizados: 2,
        disclaimer: {
            version: '1.0-consultor',
            texto: 'Respuesta orientativa del consultor sobre una causa ya analizada. No constituye consejo legal definitivo.'
        }
    }
}

/**
 * Simula latencia de red para desarrollo
 */
const simulateLatency = () => new Promise(resolve =>
    setTimeout(resolve, 1500 + Math.random() * 1000)
)

/**
 * Clase de servicio API
 */
class AlcanceLegalAPI {
    constructor() {
        this.config = N8N_CONFIG
    }

    /**
     * Envía consulta de análisis penal al pipeline LIS.
     * Flujo: Edge Function /analizar-caso → fallback mock en desarrollo
     * @param {Object} data - { hechos, etapa_procesal?, prueba_acusacion?, pretension_defensiva?, tipo_penal? }
     * @returns {Promise<Object>} - Respuesta del pipeline (success, status, data, advertencias, disclaimer, meta)
     */
    async analizarCaso(data) {
        if (SUPABASE_CONFIG.functionsUrl && !this.config.useMocks) {
            try {
                console.log('[API] Llamando Edge Function analizar-caso...')

                const response = await fetch(`${SUPABASE_CONFIG.functionsUrl}/analizar-caso`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${await getAuthToken()}`,
                        'apikey': SUPABASE_CONFIG.anonKey
                    },
                    body: JSON.stringify(data)
                })

                if (!response.ok) {
                    const text = await response.text()
                    console.error('[API] Edge Function HTTP error:', response.status, text)
                    try { return JSON.parse(text) } catch { /* no JSON */ }
                    const mensajesHttp = {
                        400: 'La consulta no pudo procesarse. Revisá los datos ingresados.',
                        401: 'No tenés autorización para usar este servicio.',
                        403: 'Acceso denegado. Verificá tu suscripción.',
                        422: 'La consulta no cumple los requisitos mínimos para el análisis.',
                        429: 'Demasiadas consultas en poco tiempo. Esperá un momento antes de reintentar.',
                        500: 'Error interno del servidor. El equipo fue notificado. Intentá nuevamente en unos minutos.',
                    }
                    const msg = mensajesHttp[response.status] || 'Ocurrió un error inesperado. Intentá nuevamente.'
                    return { success: false, fundamento: msg }
                }

                const result = await response.json()
                console.log('[API] Edge Function respondió:', result.success ? 'success' : 'rechazo', result.codigo || result.status)
                return result

            } catch (error) {
                console.error('[API] Edge Function error de red:', error.message)
                return { success: false, fundamento: `Error de red: ${error.message}` }
            }
        }

        // Fallback: mock penal (desarrollo o falla de red)
        await simulateLatency()
        return MOCK_RESPONSES.analizar
    }

    /**
     * Audita la estrategia defensiva contra la Edge Function auditar-estrategia.
     * @param {Object} data - { etapa_procesal, situacion_procesal, estrategia_actual, objetivo_defensivo, ... }
     * @returns {Promise<Object>} - Dictamen de auditoría
     */
    async auditarEstrategia(data) {
        if (SUPABASE_CONFIG.functionsUrl && !this.config.useMocks) {
            try {
                console.log('[API] Llamando Edge Function auditar-estrategia...')
                const response = await fetch(`${SUPABASE_CONFIG.functionsUrl}/auditar-estrategia`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${await getAuthToken()}`,
                        'apikey': SUPABASE_CONFIG.anonKey
                    },
                    body: JSON.stringify(data)
                })

                if (!response.ok) {
                    const text = await response.text()
                    try { return JSON.parse(text) } catch { /* no JSON */ }
                    return { success: false, fundamento: `Error del servidor (${response.status})` }
                }

                return await response.json()
            } catch (error) {
                console.error('[API] auditar-estrategia error de red:', error.message)
                return { success: false, fundamento: `Error de red: ${error.message}` }
            }
        }

        // Fallback mock
        await simulateLatency()
        return { success: true, data: MOCK_RESPONSES.auditar }
    }

    /**
     * Genera borrador de escrito penal contra la Edge Function redactar-escrito.
     * @param {Object} data - { tipo_escrito, nombre_imputado, hechos_relevantes, pretension_defensiva, ... }
     * @returns {Promise<Object>} - Borrador del escrito + secciones pendientes
     */
    async redactarEscrito(data) {
        if (SUPABASE_CONFIG.functionsUrl && !this.config.useMocks) {
            try {
                console.log('[API] Llamando Edge Function redactar-escrito...')
                const response = await fetch(`${SUPABASE_CONFIG.functionsUrl}/redactar-escrito`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${await getAuthToken()}`,
                        'apikey': SUPABASE_CONFIG.anonKey
                    },
                    body: JSON.stringify(data)
                })

                if (!response.ok) {
                    const text = await response.text()
                    try { return JSON.parse(text) } catch { /* no JSON */ }
                    return { success: false, fundamento: `Error del servidor (${response.status})` }
                }

                return await response.json()
            } catch (error) {
                console.error('[API] redactar-escrito error de red:', error.message)
                return { success: false, fundamento: `Error de red: ${error.message}` }
            }
        }

        // Fallback mock
        await simulateLatency()
        return { success: true, data: MOCK_RESPONSES.redactar }
    }

    /**
     * Consultor anclado al análisis: pregunta de seguimiento sobre una causa
     * ya analizada, contra la Edge Function consultor-caso.
     * @param {Object} data - { pregunta, contexto: {numero_informe, hechos, ...}, historial: [{role, content}] }
     * @returns {Promise<Object>} - { success, respuesta, criterios_utilizados, disclaimer }
     */
    async consultorCaso(data) {
        if (SUPABASE_CONFIG.functionsUrl && !this.config.useMocks) {
            try {
                console.log('[API] Llamando Edge Function consultor-caso...')
                const response = await fetch(`${SUPABASE_CONFIG.functionsUrl}/consultor-caso`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${await getAuthToken()}`,
                        'apikey': SUPABASE_CONFIG.anonKey
                    },
                    body: JSON.stringify(data)
                })

                if (!response.ok) {
                    const text = await response.text()
                    try { return JSON.parse(text) } catch { /* no JSON */ }
                    return { success: false, fundamento: `Error del servidor (${response.status})` }
                }

                return await response.json()
            } catch (error) {
                console.error('[API] consultor-caso error de red:', error.message)
                return { success: false, fundamento: `Error de red: ${error.message}` }
            }
        }

        // Fallback mock
        await simulateLatency()
        return MOCK_RESPONSES.consultor
    }

    /**
     * Método interno para POST requests
     */
    async _post(endpoint, data) {
        try {
            const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()
            return { success: true, data: result }

        } catch (error) {
            console.error('API Error:', error)
            return {
                success: false,
                error: error.message || 'Error de conexión con el servidor'
            }
        }
    }
}

// Exportar instancia singleton
export const api = new AlcanceLegalAPI()
export default api
