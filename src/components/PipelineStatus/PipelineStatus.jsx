import { useState } from 'react'
import './PipelineStatus.css'

const FASES_DEFAULT = [
    {
        id: 'admisibilidad',
        nombre: 'Admisibilidad',
        subtitulo: 'Verifica que la consulta sea penal PBA con hechos suficientes',
    },
    {
        id: 'rag',
        nombre: 'RAG Penal',
        subtitulo: 'Recupera criterios jurídicos verificados del corpus',
    },
    {
        id: 'razonamiento',
        nombre: 'Razonamiento LIS',
        subtitulo: 'Razona desde la perspectiva defensiva',
    },
    {
        id: 'validacion',
        nombre: 'Validación de calidad',
        subtitulo: 'Controla sesgo acusatorio y certeza excesiva',
    },
    {
        id: 'informe',
        nombre: 'Informe + PDF',
        subtitulo: 'Genera el informe numerado con disclaimer institucional',
    },
]

function IconoFase({ estado, numero }) {
    if (estado === 'completada') {
        return (
            <div className="pipeline__icono pipeline__icono--completada">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            </div>
        )
    }
    if (estado === 'rechazada') {
        return (
            <div className="pipeline__icono pipeline__icono--rechazada">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </div>
        )
    }
    if (estado === 'ejecutando') {
        return (
            <div className="pipeline__icono pipeline__icono--ejecutando">
                <span className="pipeline__pulso" />
                <span>{numero}</span>
            </div>
        )
    }
    return (
        <div className="pipeline__icono pipeline__icono--pendiente">
            <span>{numero}</span>
        </div>
    )
}

export default function PipelineStatus({ phases, mostrarDetalle = true }) {
    const [expandida, setExpandida] = useState(null)

    const fases = phases || FASES_DEFAULT.map(f => ({ ...f, estado: 'pendiente' }))

    function toggleDetalle(id) {
        if (!mostrarDetalle) return
        setExpandida(prev => (prev === id ? null : id))
    }

    return (
        <div className="pipeline">
            {fases.map((fase, i) => {
                const estaExpandida = expandida === fase.id
                const tieneDetalle = mostrarDetalle && fase.detalle && (fase.estado === 'completada' || fase.estado === 'rechazada')
                const esUltima = i === fases.length - 1

                return (
                    <div key={fase.id} className="pipeline__item">
                        <div className="pipeline__conector-col">
                            <IconoFase estado={fase.estado} numero={i + 1} />
                            {!esUltima && (
                                <div className={`pipeline__linea pipeline__linea--${fase.estado === 'completada' ? 'completa' : 'pendiente'}`} />
                            )}
                        </div>

                        <div className="pipeline__contenido">
                            <div
                                className={`pipeline__fase-header${tieneDetalle ? ' pipeline__fase-header--clickable' : ''}`}
                                onClick={() => tieneDetalle && toggleDetalle(fase.id)}
                            >
                                <div>
                                    <span className={`pipeline__nombre pipeline__nombre--${fase.estado}`}>
                                        {fase.nombre}
                                    </span>
                                    <span className="pipeline__subtitulo">{fase.subtitulo}</span>
                                </div>
                                {tieneDetalle && (
                                    <span className={`pipeline__chevron${estaExpandida ? ' pipeline__chevron--abierto' : ''}`}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </span>
                                )}
                            </div>

                            {estaExpandida && fase.detalle && (
                                <div className="pipeline__detalle">
                                    {fase.detalle}
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
