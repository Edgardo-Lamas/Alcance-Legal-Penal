import { useState, useRef, useEffect } from 'react'
import { api } from '../../services/api'
import './ConsultorChat.css'

const SUGERENCIAS = [
    '¿Qué planteo conviene presentar primero?',
    '¿Qué riesgos tiene la nulidad detectada?',
    '¿Puedo pedir la excarcelación en esta etapa?',
]

/**
 * Consultor anclado al análisis: chat de seguimiento sobre la causa del
 * informe abierto. El contexto (hechos, etapa, delito, informe) viaja con
 * cada pregunta — el consultor responde solo sobre esta causa.
 */
function ConsultorChat({ contexto }) {
    const [mensajes, setMensajes] = useState([])
    const [pregunta, setPregunta] = useState('')
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState('')
    const listaRef = useRef(null)

    useEffect(() => {
        if (listaRef.current) {
            listaRef.current.scrollTop = listaRef.current.scrollHeight
        }
    }, [mensajes, cargando])

    const enviar = async (texto) => {
        const preguntaLimpia = (texto ?? pregunta).trim()
        if (preguntaLimpia.length < 10 || cargando) return

        setError('')
        setPregunta('')
        setMensajes(prev => [...prev, { role: 'user', content: preguntaLimpia }])
        setCargando(true)

        try {
            const historial = mensajes.slice(-12)
            const res = await api.consultorCaso({ pregunta: preguntaLimpia, contexto, historial })

            if (res.success && res.respuesta) {
                setMensajes(prev => [...prev, {
                    role: 'assistant',
                    content: res.respuesta,
                    criterios: res.criterios_utilizados ?? 0,
                }])
            } else {
                setError(res.fundamento || 'El consultor no pudo responder. Intente nuevamente.')
                setMensajes(prev => prev.slice(0, -1))
                setPregunta(preguntaLimpia)
            }
        } catch {
            setError('Error de conexión. Intente nuevamente.')
            setMensajes(prev => prev.slice(0, -1))
            setPregunta(preguntaLimpia)
        } finally {
            setCargando(false)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        enviar()
    }

    return (
        <section className="consultor" aria-label="Consultor del caso">
            <header className="consultor__header">
                <div className="consultor__icono">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                </div>
                <div>
                    <h2 className="consultor__titulo">Consultor del caso</h2>
                    <p className="consultor__subtitulo">
                        Preguntas de seguimiento sobre esta causa — con el informe
                        {contexto?.numero_informe ? ` ${contexto.numero_informe}` : ''} como base.
                    </p>
                </div>
            </header>

            <div className="consultor__mensajes" ref={listaRef}>
                {mensajes.length === 0 && !cargando && (
                    <div className="consultor__vacio">
                        <p>Consulte alternativas estratégicas, alcance de las nulidades detectadas u orden de los planteos.</p>
                        <div className="consultor__sugerencias">
                            {SUGERENCIAS.map(s => (
                                <button key={s} type="button" className="consultor__sugerencia" onClick={() => enviar(s)}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {mensajes.map((m, i) => (
                    <div key={i} className={`consultor__msg consultor__msg--${m.role}`}>
                        <div className="consultor__burbuja">
                            {m.content.split('\n').filter(Boolean).map((p, j) => <p key={j}>{p}</p>)}
                            {m.role === 'assistant' && m.criterios > 0 && (
                                <span className="consultor__criterios">
                                    {m.criterios} criterio{m.criterios > 1 ? 's' : ''} del corpus consultado{m.criterios > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>
                ))}

                {cargando && (
                    <div className="consultor__msg consultor__msg--assistant">
                        <div className="consultor__burbuja consultor__burbuja--cargando">
                            <span className="consultor__dot" /><span className="consultor__dot" /><span className="consultor__dot" />
                        </div>
                    </div>
                )}
            </div>

            {error && <div className="consultor__error" role="alert">{error}</div>}

            <form className="consultor__form" onSubmit={handleSubmit}>
                <textarea
                    className="consultor__input"
                    rows="2"
                    value={pregunta}
                    onChange={(e) => setPregunta(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            enviar()
                        }
                    }}
                    placeholder="Pregunte sobre esta causa (mínimo 10 caracteres)..."
                    maxLength={1500}
                    disabled={cargando}
                />
                <button
                    type="submit"
                    className="consultor__enviar"
                    disabled={cargando || pregunta.trim().length < 10}
                    aria-label="Enviar pregunta"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                </button>
            </form>

            <p className="consultor__disclaimer">
                Respuestas orientativas sobre la causa analizada — no constituyen consejo legal definitivo.
                La estrategia y la decisión corresponden al abogado defensor.
            </p>
        </section>
    )
}

export default ConsultorChat
