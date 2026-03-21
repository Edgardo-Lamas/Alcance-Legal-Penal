import { useLocation, useNavigate } from 'react-router-dom'
import './Resultado.css'

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
    const { capacidad, data } = location.state || {}

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

            <main className="resultado__main">
                {capacidad === 'analizar' && renderAnalisis()}
                {capacidad === 'auditar' && renderAuditoria()}
                {capacidad === 'redactar' && renderRedaccion()}
            </main>

            <footer className="resultado__footer">
                <div className="resultado__footer-disclaimer">
                    Este documento fue generado por Alcance Legal Penal. Su uso está sujeto a los términos de servicio
                    y requiere validación del abogado defensor actuante antes de cualquier aplicación práctica.
                </div>
                <div className="resultado__actions">
                    <button className="btn btn--secondary" onClick={() => navigate('/')}>
                        Nueva Consulta
                    </button>
                    <button className="btn btn--primary">
                        Exportar PDF
                    </button>
                </div>
            </footer>
        </div>
    )
}

export default Resultado
