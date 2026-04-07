import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import { useAuth } from '../../context/AuthContext'
import PipelineStatus from '../../components/PipelineStatus/PipelineStatus'
import { generarReportePDF } from '../../utils/generarReportePDF'
import { generarReporteWord } from '../../utils/generarReporteWord'
import './Resultado.css'

function FeedbackWidget({ numeroInforme, tipoAnalisis }) {
    const { user } = useAuth()
    const [estado, setEstado] = useState('idle') // idle | selected | enviado
    const [rating, setRating] = useState(null)
    const [comentario, setComentario] = useState('')
    const [enviando, setEnviando] = useState(false)

    const seleccionar = (valor) => {
        setRating(valor)
        setEstado('selected')
    }

    const enviar = async () => {
        if (!supabase || rating === null) return
        setEnviando(true)
        await supabase.from('feedback').insert({
            user_id: user?.id ?? null,
            numero_informe: numeroInforme,
            tipo_analisis: tipoAnalisis,
            rating,
            comentario: comentario.trim() || null,
        }).catch(() => {})
        setEstado('enviado')
        setEnviando(false)
    }

    if (estado === 'enviado') {
        return (
            <div className="feedback feedback--enviado">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Gracias por tu feedback — nos ayuda a mejorar el sistema.</span>
            </div>
        )
    }

    return (
        <div className="feedback">
            <p className="feedback__pregunta">¿Fue útil este análisis?</p>
            <div className="feedback__botones">
                <button
                    className={`feedback__btn feedback__btn--si ${rating === true ? 'feedback__btn--activo' : ''}`}
                    onClick={() => seleccionar(true)}
                    aria-label="Útil"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                        <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                    </svg>
                    Sí, fue útil
                </button>
                <button
                    className={`feedback__btn feedback__btn--no ${rating === false ? 'feedback__btn--activo feedback__btn--activo-no' : ''}`}
                    onClick={() => seleccionar(false)}
                    aria-label="No útil"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                        <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                    </svg>
                    Puede mejorar
                </button>
            </div>

            {estado === 'selected' && (
                <div className="feedback__comentario">
                    <textarea
                        className="feedback__textarea"
                        placeholder="¿Qué podría mejorar? (opcional)"
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        rows={2}
                        maxLength={500}
                    />
                    <button
                        className="feedback__enviar"
                        onClick={enviar}
                        disabled={enviando}
                    >
                        {enviando ? 'Enviando...' : 'Enviar'}
                    </button>
                </div>
            )}
        </div>
    )
}

// Datos de ejemplo — se muestran cuando se navega a /resultado sin estado (acceso directo)
const ejemploAnalisis = {
    numero_informe: 'ALC-PENAL-PBA-2026-001547',
    fecha_emision: new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' }),
    estado: 'INFORME APROBADO',
    estado_detalle: 'Defensa Penal PBA — In dubio pro reo',

    encuadre_procesal:
        'La causa se encuentra en etapa de Investigación Penal Preparatoria (IPP) bajo el CPP PBA (Ley 11.922). ' +
        'El tipo penal imputado exige la acreditación de todos sus elementos constitutivos por parte de la acusación. ' +
        'La defensa técnica no tiene obligación de probar inocencia (CN Art. 18; CADH Art. 8.2).',

    analisis_prueba_cargo:
        'La prueba de cargo consiste en prueba testimonial de la denunciante. Para que el testimonio único ' +
        'sea suficiente para destruir la presunción de inocencia, el SCBA exige: persistencia sin contradicciones ' +
        'relevantes, ausencia de motivación espuria, corroboración periférica objetiva y verosimilitud intrínseca. ' +
        'La ausencia o debilidad de alguno de estos elementos activa el in dubio pro reo.',

    nulidades_y_vicios:
        'Se recomienda examinar: (1) regularidad de la obtención de prueba y cadena de custodia; ' +
        '(2) cumplimiento de la intimación de hechos en términos claros y precisos (CPP PBA Art. 308); ' +
        '(3) vigencia del plazo razonable (CADH Art. 8.1). ' +
        'Cualquier vicio formal en la obtención o incorporación de prueba puede generar nulidad relativa o absoluta.',

    contraargumentacion:
        'Los argumentos acusatorios presentan debilidades en la acreditación de los elementos objetivos del tipo. ' +
        'La defensa debe señalar las inconsistencias probatorias y los elementos constitutivos no acreditados. ' +
        'La existencia de duda razonable sobre cualquier elemento constitutivo activa obligatoriamente el in dubio pro reo.',

    conclusion_defensiva:
        'Se recomienda explorar: sobreseimiento por insuficiencia probatoria (CPP PBA Art. 323 inc. 3) ' +
        'o por atipicidad de la conducta (inc. 1); en subsidio, nulidad de los actos procesales viciados. ' +
        'La estrategia definitiva requiere acceso al expediente completo y revisión de todas las actas.',

    limitaciones:
        'El análisis se basa exclusivamente en los hechos informados. El acceso al expediente completo, ' +
        'actas de procedimiento y prueba documental permitiría un análisis más preciso. ' +
        'Factores procesales no declarados pueden alterar las conclusiones.',

    _status: 'approved',
    _advertencias: [],
    _disclaimer: {
        version: '1.2-penal',
        texto: 'Este análisis es un insumo técnico de defensa penal. No constituye consejo legal definitivo.',
        advertencias: [
            'Este análisis NO constituye opinión legal ni consejo profesional.',
            'El sistema opera EXCLUSIVAMENTE desde la perspectiva de la defensa penal.',
            'La decisión estratégica corresponde exclusivamente al abogado defensor actuante.'
        ]
    },
    _meta: {
        criterios_utilizados: 4,
        pipeline_version: '1.0-lis-penal_pba',
        timestamp: new Date().toISOString()
    }
}

const ejemploAuditoria = {
    numero_informe: 'ALC-AUD-2026-000892',
    fecha_emision: new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' }),
    estado: 'DICTAMEN DE AUDITORÍA',
    estado_detalle: 'Requiere revisión de los puntos señalados',
    consistencia: {
        valor: 'PARCIAL',
        explicacion: 'La estrategia presenta líneas argumentales sólidas pero contiene supuestos implícitos no validados.',
        advertencia: 'Se recomienda revisar los puntos señalados antes de avanzar con la ejecución de la estrategia.'
    },
    observaciones: [
        {
            tipo: 'supuesto_implicito',
            codigo: 'OBS-001',
            descripcion: 'Se asume que la contraparte no cuestionará la validez de los actos procesales.',
            impacto: 'Si se plantean nulidades, la estrategia probatoria actual podría resultar insuficiente.',
            severidad: 'media'
        }
    ],
    recomendaciones: [
        { prioridad: 'alta', accion: 'Incorporar línea argumental subsidiaria para el supuesto de nulidades procesales.' }
    ],
    advertencias: {
        principal: 'La auditoría detecta patrones potencialmente problemáticos. La decisión final corresponde al profesional actuante.',
        items: [
            'Este dictamen evalúa consistencia lógica, no garantiza resultados procesales.',
            'La validación final requiere conocimiento del expediente completo.'
        ]
    }
}

const ejemploRedaccion = {
    numero_informe: 'ALC-RED-2026-002341',
    fecha_emision: new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' }),
    estado: 'BORRADOR ASISTIDO',
    estado_detalle: 'Documento de trabajo - NO PRESENTAR sin revisión profesional',
    tipo_escrito: 'Escrito de Defensa',
    contenido: `PLANTEA NULIDAD / SOLICITA SOBRESEIMIENTO

Sr. Juez de Garantías:

[Nombre del letrado], abogado defensor, T° [...] F° [...] del C.P.A.C.P., constituyendo domicilio en [...], en representación de [IMPUTADO], a V.S. respetuosamente digo:

I. OBJETO
[SECCIÓN PENDIENTE - Detallar pretensión defensiva]

II. HECHOS Y ANTECEDENTES
[SECCIÓN PENDIENTE - Narrar los hechos desde la perspectiva de la defensa]

III. DERECHO
[SECCIÓN PENDIENTE - Desarrollar fundamentos normativos: CPP PBA + CN + CADH]

...`,
    secciones_pendientes: [
        { seccion: 'I. OBJETO', motivo: 'Precisar pretensión (sobreseimiento, nulidad, etc.)', criticidad: 'alta' },
        { seccion: 'II. HECHOS', motivo: 'Narrar desde la perspectiva de la defensa', criticidad: 'alta' },
        { seccion: 'III. DERECHO', motivo: 'Ajustar citas normativas (CPP PBA + CN + CADH)', criticidad: 'alta' }
    ],
    advertencias: {
        principal: 'ADVERTENCIA CRÍTICA: Este documento es un BORRADOR. Su presentación judicial sin revisión completa del letrado constituye ejercicio inadecuado de la profesión.',
        items: [
            'El letrado firmante asume responsabilidad exclusiva por el contenido presentado.',
            'Verificar datos de las partes y fechas antes de cualquier uso.',
            'Las citas normativas deben ser validadas contra el CPP PBA vigente.'
        ]
    }
}

function Resultado() {
    const location = useLocation()
    const navigate = useNavigate()
    const { capacidad, data, _fromHistorial, _historialError } = location.state || {}
    const [pasoActual, setPasoActual] = useState(_fromHistorial ? 2 : 1)
    const [pipelineVisible, setPipelineVisible] = useState(false)

    if (!capacidad) {
        return (
            <div className="resultado resultado--vacio">
                <h1>No hay resultados para mostrar</h1>
                <p>Debe completar un formulario de consulta primero.</p>
                <button className="btn btn--primary" onClick={() => navigate('/')}>
                    Ir al Dashboard
                </button>
            </div>
        )
    }

    const informe = data || (capacidad === 'analizar' ? ejemploAnalisis
        : capacidad === 'auditar' ? ejemploAuditoria
            : ejemploRedaccion)

    const titulos = {
        analizar: 'Informe de Defensa Penal',
        auditar: 'Dictamen de Auditoría Estratégica',
        redactar: 'Borrador de Escrito Judicial'
    }

    const renderEncabezado = () => (
        <div className="resultado__encabezado-informe">
            <div className="resultado__encabezado-meta">
                <span className="resultado__numero-informe">N° {informe.numero_informe}</span>
                <span className="resultado__fecha-informe">
                    {typeof informe.fecha_emision === 'string' && informe.fecha_emision.includes('T')
                        ? new Date(informe.fecha_emision).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })
                        : informe.fecha_emision}
                </span>
            </div>
            <div className={`resultado__estado-badge resultado__estado-badge--${capacidad}`}>
                <span className="resultado__estado-label">{informe.estado}</span>
                <span className="resultado__estado-detalle">{informe.estado_detalle}</span>
            </div>
        </div>
    )

    const renderSeccion = (titulo, icono, contenido) => {
        if (!contenido) return null
        return (
            <section className="resultado__section">
                <h2 className="resultado__section-title">
                    <span className="resultado__section-icon">{icono}</span>
                    {titulo}
                </h2>
                <div className="resultado__content">
                    {contenido.split('\n\n').map((p, i) => (
                        <p key={i}>{p}</p>
                    ))}
                </div>
            </section>
        )
    }

    const renderPatrones = () => {
        const patrones = informe.patrones_detectados
        if (!patrones || patrones.length === 0) return null
        const presentes = patrones.filter(p => p.presente)
        if (presentes.length === 0) return null
        const orden = { alto: 0, medio: 1, bajo: 2 }
        const sorted = [...presentes].sort((a, b) => orden[a.nivel_alerta] - orden[b.nivel_alerta])
        return (
            <section className="resultado__section resultado__patrones">
                <h2 className="resultado__section-title">
                    <span className="resultado__section-icon">🚨</span>
                    Patrones Procesales Detectados
                    <span className="resultado__patrones-badge">{sorted.length} alerta{sorted.length !== 1 ? 's' : ''}</span>
                </h2>
                <p className="resultado__patrones-desc">
                    El sistema identificó los siguientes patrones procesales que requieren atención defensiva prioritaria.
                </p>
                <div className="resultado__patrones-lista">
                    {sorted.map(p => (
                        <div key={p.id} className={`resultado__patron resultado__patron--${p.nivel_alerta}`}>
                            <div className="resultado__patron-header">
                                <span className="resultado__patron-id">{p.id}</span>
                                <span className="resultado__patron-nombre">{p.nombre_corto}</span>
                                <span className={`resultado__patron-nivel resultado__patron-nivel--${p.nivel_alerta}`}>
                                    {p.nivel_alerta.toUpperCase()}
                                </span>
                            </div>
                            <p className="resultado__patron-nota">{p.nota_resumen}</p>
                            {p.secciones_relacionadas?.length > 0 && (
                                <div className="resultado__patron-secciones">
                                    <span className="resultado__patron-secciones-label">Ver en: </span>
                                    {p.secciones_relacionadas.map((s, i) => (
                                        <span key={i} className="resultado__patron-seccion-tag">
                                            {s.replace(/_/g, ' ')}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        )
    }

    const renderIndicadorPasos = () => (
        <div className="resultado__pasos">
            <div className={`resultado__paso-item ${pasoActual === 1 ? 'resultado__paso-item--activo' : 'resultado__paso-item--inactivo'}`}>
                <span className="resultado__paso-num">①</span>
                <span className="resultado__paso-label">Análisis Preliminar</span>
            </div>
            <div className="resultado__paso-linea" />
            <div className={`resultado__paso-item ${pasoActual === 2 ? 'resultado__paso-item--activo' : 'resultado__paso-item--inactivo'}`}>
                <span className="resultado__paso-num">②</span>
                <span className="resultado__paso-label">Estrategia Defensiva</span>
            </div>
        </div>
    )

    const renderPreliminar = () => (
        <>
            {renderEncabezado()}
            <div className="resultado__badge-preliminar">
                ANÁLISIS PRELIMINAR — Verificá el encuadre antes de continuar
            </div>
            {renderSeccion('Encuadre Procesal', '⚖️', informe.encuadre_procesal)}
            {renderSeccion('Análisis de Prueba de Cargo', '🔬', informe.analisis_prueba_cargo)}
            {renderSeccion('Limitaciones del Análisis', '⚠️', informe.limitaciones)}
            <div className="resultado__confirmacion">
                <p className="resultado__confirmacion-titulo">¿El encuadre es correcto?</p>
                <p className="resultado__confirmacion-texto">
                    Revisá que el sistema haya interpretado correctamente los hechos, la etapa procesal y el tipo penal imputado.
                    Solo avanzá si el encuadre refleja fielmente la situación del caso.
                    Si hay errores, volvé al formulario y corregí los datos antes de continuar.
                </p>
                <div className="resultado__confirmacion-acciones">
                    <button
                        className="btn btn--primary"
                        onClick={() => { setPasoActual(2); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                    >
                        El encuadre es correcto — Ver Estrategia Defensiva
                    </button>
                    <button className="btn btn--secondary" onClick={() => navigate(-1)}>
                        Volver a cargar datos
                    </button>
                </div>
            </div>
        </>
    )

    const renderAnalisis = () => (
        <>
            {renderEncabezado()}

            {/* Advertencias de validación (status: limited) */}
            {informe._status === 'limited' && informe._advertencias?.length > 0 && (
                <div className="resultado__advertencia-validacion">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <div>
                        <strong>Advertencias de validación:</strong>
                        <ul>
                            {informe._advertencias.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                    </div>
                </div>
            )}

            {/* Secciones del análisis penal */}
            {renderSeccion('Encuadre Procesal', '⚖️', informe.encuadre_procesal)}
            {renderSeccion('Análisis de Prueba de Cargo', '🔬', informe.analisis_prueba_cargo)}
            {renderSeccion('Nulidades y Vicios Procesales', '🚫', informe.nulidades_y_vicios)}
            {renderSeccion('Contraargumentación de la Acusación', '🛡️', informe.contraargumentacion)}
            {renderSeccion('Conclusión Defensiva', '📋', informe.conclusion_defensiva)}
            {renderSeccion('Limitaciones del Análisis', '⚠️', informe.limitaciones)}

            {/* Patrones procesales detectados */}
            {renderPatrones()}

            {/* Disclaimer institucional */}
            {informe._disclaimer && (
                <section className="resultado__advertencias-section">
                    <div className="resultado__advertencia-principal">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <p>{informe._disclaimer.texto}</p>
                    </div>
                    <ul className="resultado__advertencias-lista">
                        {informe._disclaimer.advertencias.map((a, i) => (
                            <li key={i}>{a}</li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Metadata técnica */}
            {informe._meta && (
                <div className="resultado__meta-tecnica">
                    <span>Criterios RAG utilizados: {informe._meta.criterios_utilizados}</span>
                    <span>Pipeline: {informe._meta.pipeline_version}</span>
                </div>
            )}
        </>
    )

    const renderAuditoria = () => (
        <>
            {renderEncabezado()}

            <section className="resultado__consistencia-section">
                <h2 className="resultado__section-title">
                    <span className="resultado__section-icon">🎯</span>
                    Evaluación de Consistencia Estratégica
                </h2>
                <div className="resultado__consistencia-card">
                    <span className={`resultado__consistencia-valor resultado__consistencia-valor--${informe.consistencia.valor.toLowerCase()}`}>
                        {informe.consistencia.valor}
                    </span>
                    <p className="resultado__consistencia-explicacion">{informe.consistencia.explicacion}</p>
                    <div className="resultado__consistencia-advertencia">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <p>{informe.consistencia.advertencia}</p>
                    </div>
                </div>
            </section>

            <section className="resultado__section">
                <h2 className="resultado__section-title">
                    <span className="resultado__section-icon">🔍</span>
                    Observaciones Críticas
                </h2>
                <div className="resultado__observaciones">
                    {informe.observaciones.map((o, i) => (
                        <div key={i} className={`resultado__observacion resultado__observacion--${o.severidad}`}>
                            <div className="resultado__observacion-header">
                                <span className="resultado__observacion-codigo">{o.codigo}</span>
                                <span className="resultado__observacion-tipo">
                                    {o.tipo === 'supuesto_implicito' ? '💭 Supuesto Implícito' : '⚡ Inconsistencia Detectada'}
                                </span>
                            </div>
                            <p className="resultado__observacion-descripcion">{o.descripcion}</p>
                            <p className="resultado__observacion-impacto">
                                <strong>Impacto potencial:</strong> {o.impacto}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="resultado__section">
                <h2 className="resultado__section-title">
                    <span className="resultado__section-icon">✅</span>
                    Recomendaciones de Acción
                </h2>
                <div className="resultado__recomendaciones-lista">
                    {informe.recomendaciones.map((r, i) => (
                        <div key={i} className={`resultado__recomendacion resultado__recomendacion--${r.prioridad}`}>
                            <span className="resultado__recomendacion-prioridad">
                                PRIORIDAD {r.prioridad.toUpperCase()}
                            </span>
                            <p>{r.accion}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="resultado__advertencias-section">
                <div className="resultado__advertencia-principal">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <p>{informe.advertencias.principal}</p>
                </div>
                <ul className="resultado__advertencias-lista">
                    {informe.advertencias.items.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
            </section>
        </>
    )

    const renderRedaccion = () => (
        <>
            {renderEncabezado()}

            <div className="resultado__alerta-critica">
                <div className="resultado__alerta-icono">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </div>
                <div className="resultado__alerta-contenido">
                    <strong>DOCUMENTO DE TRABAJO</strong>
                    <p>Este borrador requiere revisión profesional completa. Se identifican {informe.secciones_pendientes.length} secciones que requieren intervención del letrado.</p>
                </div>
            </div>

            <div className="resultado__tipo-escrito">
                <span className="resultado__tipo-escrito-label">Tipo de Escrito:</span>
                <span className="resultado__tipo-escrito-valor">{informe.tipo_escrito}</span>
            </div>

            <section className="resultado__section resultado__section--pendientes">
                <h2 className="resultado__section-title">
                    <span className="resultado__section-icon">🔔</span>
                    Secciones Pendientes de Completar
                </h2>
                <div className="resultado__pendientes">
                    {informe.secciones_pendientes.map((s, i) => (
                        <div key={i} className={`resultado__pendiente resultado__pendiente--${s.criticidad}`}>
                            <div className="resultado__pendiente-header">
                                <span className="resultado__pendiente-seccion">{s.seccion}</span>
                                <span className={`resultado__pendiente-criticidad resultado__pendiente-criticidad--${s.criticidad}`}>
                                    {s.criticidad.toUpperCase()}
                                </span>
                            </div>
                            <p className="resultado__pendiente-motivo">{s.motivo}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="resultado__section">
                <h2 className="resultado__section-title">
                    <span className="resultado__section-icon">📝</span>
                    Borrador del Escrito
                </h2>
                <div className="resultado__borrador-container">
                    <div className="resultado__borrador-watermark">BORRADOR</div>
                    <pre className="resultado__borrador-contenido">{informe.contenido}</pre>
                </div>
            </section>

            <section className="resultado__advertencias-section resultado__advertencias-section--critica">
                <div className="resultado__advertencia-principal resultado__advertencia-principal--critica">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <p>{informe.advertencias.principal}</p>
                </div>
                <ul className="resultado__advertencias-lista">
                    {informe.advertencias.items.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
            </section>
        </>
    )

    const buildFasesPipeline = () => {
        const criterios = informe._meta?.criterios_utilizados
        const status = informe._status
        const advertencias = informe._advertencias || []
        return [
            {
                id: 'admisibilidad',
                nombre: 'Admisibilidad',
                subtitulo: 'Verifica que la consulta sea penal PBA con hechos suficientes',
                estado: 'completada',
                detalle: 'Causa admitida — fuero penal PBA'
            },
            {
                id: 'rag',
                nombre: 'RAG Penal',
                subtitulo: 'Recupera criterios jurídicos verificados del corpus',
                estado: 'completada',
                detalle: criterios != null
                    ? `${criterios} criterio${criterios !== 1 ? 's' : ''} jurídico${criterios !== 1 ? 's' : ''} recuperado${criterios !== 1 ? 's' : ''}`
                    : 'Criterios recuperados del corpus'
            },
            {
                id: 'razonamiento',
                nombre: 'Razonamiento LIS',
                subtitulo: 'Razona desde la perspectiva defensiva',
                estado: 'completada',
                detalle: 'Razonamiento defensivo completado — in dubio pro reo'
            },
            {
                id: 'validacion',
                nombre: 'Validación de calidad',
                subtitulo: 'Controla sesgo acusatorio y certeza excesiva',
                estado: 'completada',
                detalle: status === 'limited' && advertencias.length > 0
                    ? `${advertencias.length} advertencia${advertencias.length !== 1 ? 's' : ''} registrada${advertencias.length !== 1 ? 's' : ''}`
                    : 'Sin advertencias de sesgo acusatorio'
            },
            {
                id: 'informe',
                nombre: 'Informe + PDF',
                subtitulo: 'Genera el informe numerado con disclaimer institucional',
                estado: 'completada',
                detalle: informe.numero_informe ? `N° ${informe.numero_informe}` : 'Informe generado'
            },
        ]
    }

    return (
        <div className="resultado">
            <header className="resultado__header">
                <button className="resultado__back" onClick={() => navigate(-1)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Volver al formulario
                </button>
                <h1 className="resultado__title">{titulos[capacidad]}</h1>
                <p className="resultado__subtitle">Alcance Legal Penal — Defensa CPP PBA</p>
            </header>

            {capacidad === 'analizar' && renderIndicadorPasos()}

            {/* Pipeline summary colapsable — solo para analizar */}
            {capacidad === 'analizar' && (
                <div className="resultado__pipeline-resumen">
                    <button
                        className="resultado__pipeline-toggle"
                        onClick={() => setPipelineVisible(v => !v)}
                        aria-expanded={pipelineVisible}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        Ver proceso ejecutado
                        <span className="resultado__pipeline-toggle-estado">
                            5 fases completadas
                        </span>
                        <svg
                            className={`resultado__pipeline-chevron${pipelineVisible ? ' resultado__pipeline-chevron--up' : ''}`}
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                            width="14" height="14"
                        >
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </button>
                    {pipelineVisible && (
                        <div className="resultado__pipeline-contenido">
                            <PipelineStatus phases={buildFasesPipeline()} mostrarDetalle={true} />
                        </div>
                    )}
                </div>
            )}

            <main className="resultado__main">
                {capacidad === 'analizar' && pasoActual === 1 && renderPreliminar()}
                {capacidad === 'analizar' && pasoActual === 2 && renderAnalisis()}
                {capacidad === 'auditar' && renderAuditoria()}
                {capacidad === 'redactar' && renderRedaccion()}
            </main>

            {(capacidad !== 'analizar' || pasoActual === 2) && (
                <FeedbackWidget
                    numeroInforme={informe.numero_informe}
                    tipoAnalisis={capacidad}
                />
            )}

            <footer className="resultado__footer">
                <div className="resultado__footer-disclaimer">
                    Este documento fue generado por Alcance Legal Penal. Su uso está sujeto a los términos de servicio
                    y requiere validación del abogado defensor actuante antes de cualquier aplicación práctica.
                </div>
                <div className="resultado__actions">
                    <button className="btn btn--secondary" onClick={() => navigate('/')}>
                        Nueva Consulta
                    </button>
                    {(capacidad !== 'analizar' || pasoActual === 2) && !!data && (
                        <>
                            <button
                                className="btn btn--primary btn--pdf"
                                onClick={() => generarReportePDF(informe, capacidad)}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="7 10 12 15 17 10"/>
                                    <line x1="12" y1="15" x2="12" y2="3"/>
                                </svg>
                                Descargar Informe PDF
                            </button>
                            <button
                                className="btn btn--primary btn--word"
                                onClick={() => generarReporteWord(informe, capacidad)}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                    <line x1="16" y1="13" x2="8" y2="13"/>
                                    <line x1="16" y1="17" x2="8" y2="17"/>
                                    <polyline points="10 9 9 9 8 9"/>
                                </svg>
                                Descargar en Word
                            </button>
                        </>
                    )}
                </div>
            </footer>
        </div>
    )
}

export default Resultado
