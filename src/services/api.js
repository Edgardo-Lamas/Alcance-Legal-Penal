/**
 * Servicio de API para Alcance Legal Penal
 *
 * Maneja las comunicaciones con Supabase Edge Functions.
 * Endpoint principal: /analizar-caso (pipeline LIS penal completo)
 * Perspectiva: SIEMPRE desde la defensa. In dubio pro reo.
 */

// Configuración de Supabase Edge Functions
const SUPABASE_CONFIG = {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    functionsUrl: import.meta.env.VITE_SUPABASE_URL ?
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1` : null
}

// Configuración de endpoints n8n (legacy/fallback)
const N8N_CONFIG = {
    baseUrl: import.meta.env.VITE_N8N_BASE_URL || 'http://localhost:5678/webhook',
    endpoints: {
        analizar: '/analizar-caso',
        auditar: '/auditar-estrategia',
        redactar: '/redactar-escrito'
    },
    // Flag para usar mocks durante desarrollo
    useMocks: import.meta.env.VITE_USE_MOCKS !== 'false'
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
            explicacion: 'La estrategia presenta líneas argumentales sólidas pero contiene supuestos implícitos no validados e inconsistencias que podrían afectar su efectividad.',
            advertencia: 'Se recomienda revisar los puntos señalados antes de avanzar con la ejecución de la estrategia.'
        },
        observaciones: [
            {
                tipo: 'supuesto_implicito',
                codigo: 'OBS-001',
                descripcion: 'Se asume que la contraparte no cuestionará la validez del contrato.',
                impacto: 'Si la validez del instrumento es cuestionada, la estrategia probatoria actual resultaría insuficiente para sostener la pretensión.',
                severidad: 'media'
            },
            {
                tipo: 'inconsistencia',
                codigo: 'OBS-002',
                descripcion: 'El objetivo de obtener daños punitivos contradice la etapa procesal declarada.',
                impacto: 'Los daños punitivos requieren fundamentación diferenciada (art. 52 bis LDC) no contemplada en la estrategia propuesta.',
                severidad: 'alta'
            }
        ],
        recomendaciones: [
            {
                prioridad: 'alta',
                accion: 'Incorporar línea argumental subsidiaria para el supuesto de cuestionamiento de validez contractual.'
            },
            {
                prioridad: 'alta',
                accion: 'Reformular pretensión de daños punitivos o desarrollar fundamentación normativa específica.'
            },
            {
                prioridad: 'media',
                accion: 'Considerar prueba pericial contable para acreditar cuantificación del daño con mayor precisión.'
            }
        ],
        advertencias: {
            principal: 'La auditoría detecta patrones potencialmente problemáticos. La decisión final sobre la estrategia corresponde al profesional actuante.',
            items: [
                'Este dictamen evalúa consistencia lógica, no garantiza resultados procesales.',
                'Supuestos no declarados pueden contener riesgos adicionales no identificados.',
                'La validación final de la estrategia requiere conocimiento del contexto judicial específico.'
            ]
        }
    },

    redactar: {
        numero_informe: `ALC-RED-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
        fecha_emision: new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' }),
        estado: 'BORRADOR ASISTIDO',
        estado_detalle: 'Documento de trabajo - NO PRESENTAR sin revisión profesional',
        tipo_escrito: 'Demanda por Incumplimiento Contractual',
        contenido: `PROMUEVE DEMANDA POR INCUMPLIMIENTO CONTRACTUAL

Sr. Juez:

[Nombre del letrado], abogado, T° [...] F° [...] del C.P.A.C.F., constituyendo domicilio electrónico en [...] y domicilio procesal en [...], en representación de [NOMBRE DEL ACTOR], según poder que se adjunta, a V.S. respetuosamente digo:

I. OBJETO
Que vengo a promover formal demanda por incumplimiento contractual contra [NOMBRE DEL DEMANDADO], con domicilio en [...], por la suma de PESOS [MONTO] ($[...]) o lo que en más o en menos resulte de la prueba a producirse, con más sus intereses y costas.

II. HECHOS
[SECCIÓN PENDIENTE - Requiere desarrollo según cronología del caso]

III. DERECHO
[SECCIÓN PENDIENTE - Ajustar fundamentación a jurisdicción específica]

...`,
        secciones_pendientes: [
            {
                seccion: 'II. HECHOS',
                motivo: 'Requiere desarrollo detallado según cronología específica del caso',
                criticidad: 'alta'
            },
            {
                seccion: 'III. DERECHO',
                motivo: 'Ajustar citas normativas a la jurisdicción y fuero correspondiente',
                criticidad: 'alta'
            },
            {
                seccion: 'V. PRUEBA',
                motivo: 'Completar ofrecimiento según documentación efectivamente disponible',
                criticidad: 'media'
            },
            {
                seccion: 'PETITORIO',
                motivo: 'Verificar monto reclamado y accesorios solicitados',
                criticidad: 'alta'
            }
        ],
        advertencias: {
            principal: 'ADVERTENCIA CRÍTICA: Este documento es un BORRADOR DE TRABAJO generado por asistencia automatizada. Su presentación judicial sin revisión profesional completa constituye ejercicio inadecuado de la profesión.',
            items: [
                'El letrado firmante asume responsabilidad exclusiva por el contenido presentado.',
                'Verificar datos de las partes, montos y fechas antes de cualquier uso.',
                'Las citas legales deben ser validadas contra normativa vigente.',
                'El estilo y estructura pueden requerir ajustes según práctica del fuero.'
            ]
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
                        'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
                        'apikey': SUPABASE_CONFIG.anonKey
                    },
                    body: JSON.stringify(data)
                })

                if (!response.ok) {
                    const text = await response.text()
                    console.error('[API] Edge Function HTTP error:', response.status, text)
                    try { return JSON.parse(text) } catch { /* no JSON */ }
                    return { success: false, fundamento: `Error del servidor (${response.status}): ${text.slice(0, 200)}` }
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
     * Envía consulta de auditoría
     * @param {Object} data - Datos del formulario de auditoría
     * @returns {Promise<Object>} - Respuesta de la auditoría
     */
    async auditarEstrategia(data) {
        if (this.config.useMocks) {
            await simulateLatency()
            return {
                success: true,
                data: {
                    ...MOCK_RESPONSES.auditar,
                    _input: {
                        etapa_procesal: data.etapa_procesal
                    }
                }
            }
        }

        return this._post(this.config.endpoints.auditar, data)
    }

    /**
     * Envía consulta de redacción
     * @param {Object} data - Datos del formulario de redacción
     * @returns {Promise<Object>} - Respuesta con borrador
     */
    async redactarEscrito(data) {
        if (this.config.useMocks) {
            await simulateLatency()
            return {
                success: true,
                data: {
                    ...MOCK_RESPONSES.redactar,
                    tipo_escrito: data.tipo_escrito || 'Demanda',
                    _input: {
                        tipo_escrito: data.tipo_escrito
                    }
                }
            }
        }

        return this._post(this.config.endpoints.redactar, data)
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
