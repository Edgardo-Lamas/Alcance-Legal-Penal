import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { crearSuscripcion } from '../../services/api'
import './Precios.css'

const planes = [
    {
        id: 'basico',
        nombre: 'Básico',
        precio: '50.000',
        descripcion: 'Para el abogado que comienza a integrar IA en su práctica penal.',
        destacado: false,
        features: [
            '20 análisis de casos por mes',
            '100 consultas al Consultor por mes',
            'Análisis de texto completo',
            'Informe PDF descargable',
            'Corpus CPP PBA actualizado',
            'Pipeline defensivo de 5 fases',
        ],
        noIncluye: [
            'Adjuntar imágenes y pericias',
            'Acceso multi-usuario',
        ],
    },
    {
        id: 'profesional',
        nombre: 'Profesional',
        precio: '95.000',
        descripcion: 'El estándar para defensores activos con causas complejas.',
        destacado: true,
        badge: 'Más elegido',
        features: [
            '60 análisis de casos por mes',
            '250 consultas al Consultor por mes',
            'Análisis de texto completo',
            'Adjuntar imágenes (pericias, capturas)',
            'Informe PDF descargable',
            'Corpus CPP PBA actualizado',
            'Pipeline defensivo de 5 fases',
            'Soporte por correo',
        ],
        noIncluye: [
            'Acceso multi-usuario',
        ],
    },
    {
        id: 'estudio',
        nombre: 'Estudio',
        precio: '160.000',
        descripcion: 'Para estudios jurídicos con múltiples defensores activos.',
        destacado: false,
        features: [
            '150 análisis de casos por mes',
            '500 consultas al Consultor por mes',
            'Análisis de texto completo',
            'Adjuntar imágenes (pericias, capturas)',
            'Informe PDF descargable',
            'Corpus CPP PBA actualizado',
            'Pipeline defensivo de 5 fases',
            'Hasta 5 usuarios por cuenta',
            'Soporte prioritario',
        ],
        noIncluye: [],
    },
]

const iconCheck = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
)

const iconX = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
)

// El precio de la tarjeta es sólo texto: lo que se cobra lo lee la Edge
// Function crear-suscripcion de la tabla `planes` (migración 013).
const NOMBRE_PLAN = { prueba: 'Prueba', basico: 'Básico', profesional: 'Profesional', estudio: 'Estudio', cortesia: 'Cortesía' }

function Precios() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { session, profile } = useAuth()
    const [procesando, setProcesando] = useState(null)
    const [error, setError] = useState('')

    const planActual = profile?.plan ?? null
    const volvioDeMP = searchParams.get('suscripcion') === 'volver'

    const suscribirse = async (planId) => {
        setError('')
        // Sin sesión no hay a quién activarle el plan: primero entra o crea la cuenta.
        if (!session) {
            navigate('/login?volver=/precios')
            return
        }
        setProcesando(planId)
        const { init_point, error: err } = await crearSuscripcion(planId)
        if (init_point) {
            window.location.assign(init_point)
            return
        }
        setError(err ?? 'No se pudo iniciar el pago. Intentá nuevamente.')
        setProcesando(null)
    }

    const textoBoton = (planId) => {
        if (procesando === planId) return 'Abriendo Mercado Pago…'
        if (planActual === planId) return 'Tu plan actual'
        return session ? 'Suscribirme' : 'Crear cuenta y suscribirme'
    }

    return (
        <div className="precios-screen">
            <div className="precios-container">
                {/* Header */}
                <div className="precios-header">
                    <Link to={session ? '/' : '/login'} className="precios-back">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        {session ? 'Volver a la consola' : 'Volver al inicio de sesión'}
                    </Link>

                    <div className="precios-logo">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 3v18" />
                            <path d="M5 6l7-3 7 3" />
                            <path d="M5 6v6a7 7 0 0 0 7 7 7 7 0 0 0 7-7V6" />
                        </svg>
                    </div>
                    <h1 className="precios-title">Planes de Suscripción</h1>
                    <p className="precios-subtitle">
                        Alcance Legal Penal · Inteligencia Jurídica para Defensa PBA
                    </p>

                    {volvioDeMP && (
                        <p className="precios-aviso precios-aviso--ok" role="status">
                            Si el pago se aprobó, tu plan se activa solo en unos instantes.
                            Recargá esta página para verlo.
                        </p>
                    )}
                    {planActual && (
                        <p className="precios-aviso" role="status">
                            Tu plan actual: <strong>{NOMBRE_PLAN[planActual] ?? planActual}</strong>
                            {planActual === 'prueba' && profile?.creditos_analisis != null &&
                                ` — te quedan ${profile.creditos_analisis} análisis de prueba.`}
                        </p>
                    )}
                    {error && <p className="precios-aviso precios-aviso--error" role="alert">{error}</p>}

                    <p className="precios-note">
                        Todos los planes incluyen acceso completo al corpus CPP PBA (Ley 11.922) y Código Penal,
                        y la <strong>misma calidad de análisis</strong>: lo que varía es el volumen de uso, no la profundidad del trabajo.
                        Al crear tu cuenta tenés <strong>3 análisis gratis</strong> para probar el sistema con causas reales.
                    </p>
                    <p className="precios-note">
                        Los cupos son <strong>por cuenta</strong> y se renuevan el día 1 de cada mes.
                        El pago es mensual por Mercado Pago y el plan se activa apenas se aprueba.
                    </p>
                </div>

                {/* Planes */}
                <div className="precios-grid">
                    {planes.map((plan) => (
                        <div
                            key={plan.id}
                            className={`plan-card ${plan.destacado ? 'plan-card--destacado' : ''}`}
                        >
                            {plan.badge && (
                                <div className="plan-badge">{plan.badge}</div>
                            )}

                            <div className="plan-header">
                                <h2 className="plan-nombre">{plan.nombre}</h2>
                                <div className="plan-precio-wrap">
                                    <span className="plan-precio-currency">$</span>
                                    <span className="plan-precio">{plan.precio}</span>
                                    <span className="plan-periodo">/ mes</span>
                                </div>
                                <p className="plan-descripcion">{plan.descripcion}</p>
                            </div>

                            <div className="plan-features">
                                <ul className="plan-lista">
                                    {plan.features.map((f, i) => (
                                        <li key={i} className="plan-item plan-item--si">
                                            <span className="plan-icon plan-icon--si">{iconCheck}</span>
                                            {f}
                                        </li>
                                    ))}
                                    {plan.noIncluye.map((f, i) => (
                                        <li key={i} className="plan-item plan-item--no">
                                            <span className="plan-icon plan-icon--no">{iconX}</span>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button
                                type="button"
                                onClick={() => suscribirse(plan.id)}
                                disabled={procesando !== null || planActual === plan.id}
                                className={`plan-cta ${plan.destacado ? 'plan-cta--destacado' : ''}`}
                            >
                                {textoBoton(plan.id)}
                            </button>
                        </div>
                    ))}
                </div>

                {/* FAQ / notas */}
                <div className="precios-faq">
                    <h3 className="precios-faq-title">Preguntas frecuentes</h3>
                    <div className="precios-faq-grid">
                        <div className="faq-item">
                            <h4>¿Cómo obtengo acceso?</h4>
                            <p>Creá tu cuenta, probá el sistema con 3 análisis gratis y elegí un plan. El pago se hace en Mercado Pago y el plan se activa solo, apenas se aprueba.</p>
                        </div>
                        <div className="faq-item">
                            <h4>¿Qué métodos de pago aceptan?</h4>
                            <p>Tarjeta de crédito, tarjeta de débito o dinero en cuenta de Mercado Pago. El cobro se repite automáticamente cada mes.</p>
                        </div>
                        <div className="faq-item">
                            <h4>¿Puedo cambiar o cancelar?</h4>
                            <p>Sí. Podés cancelar la suscripción en cualquier momento desde tu cuenta de Mercado Pago. Para cambiar de plan, escribinos y te ayudamos.</p>
                        </div>
                        <div className="faq-item">
                            <h4>¿El corpus se actualiza?</h4>
                            <p>Sí. El corpus CPP PBA y Código Penal se mantiene actualizado. Las actualizaciones jurisprudenciales se incorporan sin costo adicional.</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="precios-footer">
                    <p>¿Tiene preguntas? Contacte a{' '}
                        <a href="mailto:contacto@studiolamas.com" className="precios-mail">
                            contacto@studiolamas.com
                        </a>
                    </p>
                    <p className="precios-legal">
                        Los precios no incluyen IVA. Acceso sujeto a términos del aviso legal del sistema.
                    </p>
                    <p className="precios-legal">
                        <Link to="/privacidad" className="precios-mail">
                            Cómo se tratan los datos de sus causas
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Precios
