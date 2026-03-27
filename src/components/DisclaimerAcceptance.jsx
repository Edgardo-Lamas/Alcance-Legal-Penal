/**
 * Componente de Aceptación del Disclaimer Legal
 *
 * Pantalla bloqueante que requiere aceptación explícita
 * antes de acceder a cualquier funcionalidad del sistema.
 *
 * NO SALTEABLE - Obligatorio para todos los usuarios
 */

import { useState, useRef, useEffect } from 'react'
import {
    DISCLAIMER_COMPLETO,
    DISCLAIMER_VERSION,
    acceptDisclaimer
} from '../constants/disclaimer'
import './DisclaimerAcceptance.css'

function DisclaimerAcceptance({ onAccept }) {
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
    const [isChecked, setIsChecked] = useState(false)
    const contentRef = useRef(null)

    // Detectar scroll al final del panel derecho
    const handleScroll = () => {
        if (contentRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = contentRef.current
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20
            if (isAtBottom) setHasScrolledToBottom(true)
        }
    }

    // Si el contenido cabe sin scroll, habilitar directamente
    useEffect(() => {
        if (contentRef.current) {
            const { scrollHeight, clientHeight } = contentRef.current
            if (scrollHeight <= clientHeight) setHasScrolledToBottom(true)
        }
    }, [])

    const handleAccept = () => {
        if (hasScrolledToBottom && isChecked) {
            acceptDisclaimer()
            onAccept()
        }
    }

    return (
        <div className="da-overlay">
            <div className="da-modal">

                {/* ── COLUMNA IZQUIERDA — Presentación del sistema ── */}
                <aside className="da-panel-izq">
                    <div className="da-marca">
                        <div className="da-marca__icono">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c9a227" strokeWidth="1.5">
                                <path d="M12 2L3 7l9 5 9-5-9-5z"/>
                                <path d="M3 12l9 5 9-5"/>
                                <path d="M3 17l9 5 9-5"/>
                            </svg>
                        </div>
                        <div>
                            <h1 className="da-marca__nombre">Alcance Legal Penal</h1>
                            <p className="da-marca__subtitulo">Sistema de Inteligencia Jurídica</p>
                        </div>
                    </div>

                    <div className="da-descripcion">
                        <div className="da-descripcion__item">
                            <span className="da-descripcion__icono da-descripcion__icono--que">¿Qué es?</span>
                            <p>Un sistema de análisis jurídico estructurado que aplica criterios defensivos verificados a casos penales de la Provincia de Buenos Aires.</p>
                        </div>
                        <div className="da-descripcion__item">
                            <span className="da-descripcion__icono da-descripcion__icono--quien">¿Para quién?</span>
                            <p>Abogados defensores, defensores públicos y equipos penales que trabajan bajo el CPP PBA (Ley 11.922).</p>
                        </div>
                        <div className="da-descripcion__item">
                            <span className="da-descripcion__icono da-descripcion__icono--no">¿Qué NO hace?</span>
                            <p>No reemplaza al abogado. No garantiza resultados. No es asesoramiento jurídico. Prefiere rechazar con fundamento antes que improvisar.</p>
                        </div>
                    </div>

                    <div className="da-badge">
                        <span>Fuero Penal · CPP PBA · Ley 11.922</span>
                    </div>
                </aside>

                {/* ── COLUMNA DERECHA — Aviso legal + aceptación ── */}
                <div className="da-panel-der">
                    <div
                        className="da-contenido"
                        ref={contentRef}
                        onScroll={handleScroll}
                    >
                        <h2 className="da-contenido__titulo">{DISCLAIMER_COMPLETO.titulo}</h2>

                        <p className="da-contenido__intro">
                            {DISCLAIMER_COMPLETO.introduccion}
                        </p>

                        <div className="da-seccion da-seccion--permite">
                            <h3>El sistema permite:</h3>
                            <ul>
                                {DISCLAIMER_COMPLETO.permite.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                            <p className="da-seccion__proposito">{DISCLAIMER_COMPLETO.propositoPositivo}</p>
                        </div>

                        <div className="da-seccion da-seccion--limita">
                            <h3>Este sistema NO constituye:</h3>
                            <ul>
                                {DISCLAIMER_COMPLETO.noConstituye.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="da-seccion">
                            <h3>Este sistema NO reemplaza:</h3>
                            <ul>
                                {DISCLAIMER_COMPLETO.noReemplaza.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="da-seccion">
                            <h3>El usuario reconoce y acepta que:</h3>
                            <ol>
                                {DISCLAIMER_COMPLETO.reconocimientos.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ol>
                        </div>

                        <div className="da-exclusion">
                            <h3>Exclusión de Responsabilidad</h3>
                            <p>{DISCLAIMER_COMPLETO.exclusionResponsabilidad}</p>
                        </div>

                        <div className="da-seccion da-seccion--pi">
                            <h3>{DISCLAIMER_COMPLETO.propiedadIntelectual.titulo}</h3>
                            <p className="da-seccion__intro-pi">{DISCLAIMER_COMPLETO.propiedadIntelectual.introduccion}</p>
                            <ol>
                                {DISCLAIMER_COMPLETO.propiedadIntelectual.condiciones.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ol>
                            <p className="da-seccion__titular-pi">{DISCLAIMER_COMPLETO.propiedadIntelectual.titular}</p>
                        </div>

                        <div className="da-metadata">
                            <p><strong>Jurisdicción:</strong> {DISCLAIMER_COMPLETO.jurisdiccion}</p>
                            <p><strong>Alcance:</strong> {DISCLAIMER_COMPLETO.alcance}</p>
                            <p className="da-metadata__version">Versión {DISCLAIMER_VERSION}</p>
                        </div>
                    </div>

                    {/* Indicador de scroll */}
                    {!hasScrolledToBottom && (
                        <div className="da-scroll-hint">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                            Desplazá hasta el final para continuar
                        </div>
                    )}

                    {/* Footer con checkbox y botón */}
                    <footer className="da-footer">
                        <label className={`da-checkbox${!hasScrolledToBottom ? ' da-checkbox--bloqueado' : ''}`}>
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => setIsChecked(e.target.checked)}
                                disabled={!hasScrolledToBottom}
                            />
                            <span>
                                Leí el aviso legal y entiendo que este sistema es una herramienta de apoyo profesional — no asesoramiento jurídico ni sustituto de la defensa técnica.
                            </span>
                        </label>

                        <button
                            className="da-btn-aceptar"
                            onClick={handleAccept}
                            disabled={!hasScrolledToBottom || !isChecked}
                        >
                            Ingresar al sistema
                        </button>

                        <p className="da-footer__ayuda">
                            El sistema puede rechazar consultas con fundamento si no cuenta con base jurídica suficiente.
                        </p>
                    </footer>
                </div>
            </div>
        </div>
    )
}

export default DisclaimerAcceptance
