import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'
import './Historial.css'

const STATUS_LABELS = {
    approved: 'Aprobado',
    limited:  'Limitado',
    rejected: 'Rechazado',
}

const ETAPA_LABELS = {
    ipp:        'IPP',
    juicio_oral:'Juicio Oral',
    recursos:   'Recursos',
    ejecucion:  'Ejecución',
}

function Historial() {
    const navigate = useNavigate()
    const [analisis, setAnalisis] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError]   = useState(null)

    useEffect(() => {
        if (!supabase) {
            setError('Historial no disponible en modo sin conexión.')
            setLoading(false)
            return
        }
        supabase
            .from('analisis')
            .select('id, numero_informe, fecha_emision, status, hechos, tipo_penal, etapa_procesal, resultado_json, criterios_utilizados')
            .order('created_at', { ascending: false })
            .limit(100)
            .then(({ data, error: err }) => {
                if (err) setError('Error al cargar el historial.')
                else setAnalisis(data || [])
                setLoading(false)
            })
    }, [])

    const abrirAnalisis = (item) => {
        const estadoLabels = {
            approved: 'INFORME APROBADO',
            limited:  'INFORME CON LIMITACIONES',
            rejected: 'NO ENTREGABLE',
        }
        navigate('/resultado', {
            state: {
                capacidad: 'analizar',
                data: {
                    ...item.resultado_json,
                    estado:        estadoLabels[item.status] || 'INFORME',
                    estado_detalle:'Defensa Penal PBA — In dubio pro reo',
                    _status:       item.status,
                    _advertencias: item.resultado_json?._advertencias || [],
                    _disclaimer:   item.resultado_json?._disclaimer,
                    _meta:         item.resultado_json?._meta,
                }
            }
        })
    }

    return (
        <div className="historial">
            <header className="historial__header">
                <button className="historial__back" onClick={() => navigate('/')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Volver
                </button>
                <h1 className="historial__title">Historial de Análisis</h1>
                <p className="historial__subtitle">
                    Consultas anteriores — ordenadas por fecha
                </p>
            </header>

            {loading && (
                <div className="historial__estado">Cargando historial...</div>
            )}

            {error && (
                <div className="historial__estado historial__estado--error">{error}</div>
            )}

            {!loading && !error && analisis.length === 0 && (
                <div className="historial__vacio">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                        <path d="M9 12h6M9 16h6M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h5l5 5v11a2 2 0 01-2 2z"/>
                    </svg>
                    <p>No hay análisis registrados todavía.</p>
                    <button className="btn btn--primary" onClick={() => navigate('/analizar')}>
                        Realizar primer análisis
                    </button>
                </div>
            )}

            {!loading && !error && analisis.length > 0 && (
                <>
                    <div className="historial__contador">
                        {analisis.length} análisis en el historial
                    </div>
                    <div className="historial__lista">
                        {analisis.map(item => (
                            <article
                                key={item.id}
                                className="historial__item"
                                onClick={() => abrirAnalisis(item)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={e => e.key === 'Enter' && abrirAnalisis(item)}
                            >
                                <div className="historial__item-header">
                                    <span className="historial__numero">{item.numero_informe}</span>
                                    <span className={`historial__status historial__status--${item.status}`}>
                                        {STATUS_LABELS[item.status] || item.status}
                                    </span>
                                </div>

                                <p className="historial__hechos">
                                    {item.hechos?.length > 140
                                        ? item.hechos.slice(0, 138) + '…'
                                        : item.hechos}
                                </p>

                                <div className="historial__item-footer">
                                    {item.tipo_penal && (
                                        <span className="historial__tag">{item.tipo_penal}</span>
                                    )}
                                    {item.etapa_procesal && (
                                        <span className="historial__tag historial__tag--etapa">
                                            {ETAPA_LABELS[item.etapa_procesal] || item.etapa_procesal}
                                        </span>
                                    )}
                                    <span className="historial__fecha">
                                        {new Date(item.fecha_emision).toLocaleDateString('es-AR', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                        })}
                                    </span>
                                    <svg className="historial__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 18l6-6-6-6"/>
                                    </svg>
                                </div>
                            </article>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

export default Historial
