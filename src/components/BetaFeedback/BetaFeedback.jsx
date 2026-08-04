import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'
import './BetaFeedback.css'

const MAX_CHARS = 500

function BetaFeedback() {
    const { user } = useAuth()
    const [abierto, setAbierto] = useState(false)
    const [estrellas, setEstrellas] = useState(0)
    const [hoverEstrellas, setHoverEstrellas] = useState(0)
    const [comentario, setComentario] = useState('')
    const [estado, setEstado] = useState('idle') // idle | enviando | enviado | error
    const [aviso, setAviso] = useState('')

    if (!user) return null

    const handleAbrir = () => {
        setAbierto(true)
        setEstado('idle')
        setEstrellas(0)
        setComentario('')
        setAviso('')
    }

    const handleCerrar = () => setAbierto(false)

    const handleEnviar = async () => {
        if (estado === 'enviando') return

        // La calificación es obligatoria, pero eso no se decía en ningún lado: el
        // botón quedaba gris y el abogado escribía el comentario sin entender por
        // qué no podía enviarlo.
        if (!estrellas) {
            setAviso('Elegí una calificación de 1 a 5 estrellas para poder enviar.')
            return
        }

        setAviso('')
        setEstado('enviando')

        const textoConRating = comentario.trim()
            ? `[${estrellas}★] ${comentario.trim()}`
            : `[${estrellas}★]`

        // insert() NO rechaza la promesa: devuelve { error }. Con el .catch()
        // que había acá y sin mirar ese campo, la tabla `feedback` no existía y
        // TODO el feedback de la beta se perdió en silencio mostrando "enviado".
        const { error } = await supabase
            ?.from('feedback')
            .insert({
                user_id: user.id,
                tipo_analisis: 'beta_general',
                rating: estrellas >= 3,
                comentario: textoConRating,
            }) ?? {}

        if (error) {
            console.error('[BetaFeedback] no se pudo guardar el feedback:', error.message)
            setEstado('error')
            return
        }

        setEstado('enviado')
    }

    return (
        <>
            {/* Botón flotante */}
            <button
                className="bf-trigger"
                onClick={handleAbrir}
                aria-label="Dejar feedback beta"
            >
                <span className="bf-trigger__badge">BETA</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
            </button>

            {/* Modal */}
            {abierto && (
                <div className="bf-overlay" onClick={handleCerrar}>
                    <div className="bf-modal" onClick={(e) => e.stopPropagation()}>

                        {/* Header */}
                        <div className="bf-modal__header">
                            <div>
                                <h3 className="bf-modal__titulo">¿Cómo va el sistema?</h3>
                                <p className="bf-modal__subtitulo">Tu opinión mejora la herramienta para todos los usuarios beta.</p>
                            </div>
                            <button className="bf-modal__cerrar" onClick={handleCerrar} aria-label="Cerrar">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>

                        {estado === 'error' ? (
                            /* Estado: no se pudo guardar. Antes esto no existía y el
                               componente agradecía igual, con el dato ya perdido. */
                            <div className="bf-enviado">
                                <p className="bf-enviado__titulo">No pudimos guardar tu comentario</p>
                                <p className="bf-enviado__texto">
                                    Hubo un problema al enviarlo. Probá de nuevo en un momento.
                                </p>
                                <button className="bf-btn-cerrar" onClick={() => setEstado('idle')}>Reintentar</button>
                            </div>
                        ) : estado === 'enviado' ? (
                            /* Estado: enviado */
                            <div className="bf-enviado">
                                <div className="bf-enviado__icono">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                </div>
                                <p className="bf-enviado__titulo">¡Gracias por tu feedback!</p>
                                <p className="bf-enviado__texto">Tu opinión nos ayuda a mejorar el sistema antes del lanzamiento.</p>
                                <button className="bf-btn-cerrar" onClick={handleCerrar}>Cerrar</button>
                            </div>
                        ) : (
                            /* Estado: formulario */
                            <>
                                {/* Estrellas */}
                                <div className="bf-estrellas">
                                    <span className="bf-estrellas__label">Calificá tu experiencia</span>
                                    <div className="bf-estrellas__fila">
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <button
                                                key={n}
                                                className={`bf-estrella ${n <= (hoverEstrellas || estrellas) ? 'bf-estrella--activa' : ''}`}
                                                onClick={() => setEstrellas(n)}
                                                onMouseEnter={() => setHoverEstrellas(n)}
                                                onMouseLeave={() => setHoverEstrellas(0)}
                                                aria-label={`${n} estrellas`}
                                            >
                                                <svg viewBox="0 0 24 24" fill="currentColor">
                                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                                </svg>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Textarea */}
                                <div className="bf-campo">
                                    <textarea
                                        className="bf-textarea"
                                        placeholder="Contame qué funcionó bien, qué faltó, qué mejorarías..."
                                        value={comentario}
                                        onChange={(e) => setComentario(e.target.value.slice(0, MAX_CHARS))}
                                        rows={4}
                                    />
                                    <span className="bf-contador">{comentario.length}/{MAX_CHARS}</span>
                                </div>

                                {aviso && (
                                    <p className="bf-aviso" role="alert">{aviso}</p>
                                )}

                                {/* Botón enviar — habilitado siempre que no esté enviando:
                                    si falta la calificación, handleEnviar lo explica en vez
                                    de dejar el botón muerto sin decir por qué. */}
                                <button
                                    className="bf-btn-enviar"
                                    onClick={handleEnviar}
                                    disabled={estado === 'enviando'}
                                >
                                    {estado === 'enviando' ? 'Enviando...' : 'Enviar feedback'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}

export default BetaFeedback
