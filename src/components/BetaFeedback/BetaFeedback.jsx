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
    const [estado, setEstado] = useState('idle') // idle | enviando | enviado

    if (!user) return null

    const handleAbrir = () => {
        setAbierto(true)
        setEstado('idle')
        setEstrellas(0)
        setComentario('')
    }

    const handleCerrar = () => setAbierto(false)

    const handleEnviar = async () => {
        if (!estrellas || estado === 'enviando') return
        setEstado('enviando')

        const textoConRating = comentario.trim()
            ? `[${estrellas}★] ${comentario.trim()}`
            : `[${estrellas}★]`

        await supabase?.from('feedback').insert({
            user_id: user.id,
            tipo_analisis: 'beta_general',
            rating: estrellas >= 3,
            comentario: textoConRating,
        }).catch(() => {})

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

                        {estado === 'enviado' ? (
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

                                {/* Botón enviar */}
                                <button
                                    className="bf-btn-enviar"
                                    onClick={handleEnviar}
                                    disabled={!estrellas || estado === 'enviando'}
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
