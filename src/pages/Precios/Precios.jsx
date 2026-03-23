import { Link } from 'react-router-dom'
import './Precios.css'

const planes = [
    {
        id: 'basico',
        nombre: 'Básico',
        precio: '29',
        periodo: 'USD / mes',
        descripcion: 'Para el abogado que comienza a integrar IA en su práctica penal.',
        destacado: false,
        features: [
            '20 análisis de casos por mes',
            'Análisis de texto completo',
            'Informe PDF descargable',
            'Corpus CPP PBA actualizado',
            'Pipeline defensivo de 5 fases',
        ],
        noIncluye: [
            'Adjuntar imágenes y pericias',
            'Acceso multi-usuario',
        ],
        cta: 'Consultar acceso',
    },
    {
        id: 'profesional',
        nombre: 'Profesional',
        precio: '59',
        periodo: 'USD / mes',
        descripcion: 'El estándar para defensores activos con causas complejas.',
        destacado: true,
        badge: 'Más elegido',
        features: [
            '100 análisis de casos por mes',
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
        cta: 'Consultar acceso',
    },
    {
        id: 'estudio',
        nombre: 'Estudio',
        precio: '99',
        periodo: 'USD / mes',
        descripcion: 'Para estudios jurídicos con múltiples defensores activos.',
        destacado: false,
        features: [
            'Análisis ilimitados',
            'Análisis de texto completo',
            'Adjuntar imágenes (pericias, capturas)',
            'Informe PDF descargable',
            'Corpus CPP PBA actualizado',
            'Pipeline defensivo de 5 fases',
            'Hasta 5 usuarios por cuenta',
            'Soporte prioritario',
        ],
        noIncluye: [],
        cta: 'Consultar acceso',
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

function Precios() {
    const mailtoLink = 'mailto:contacto@studiolamas.com?subject=Consulta%20Alcance%20Legal%20Penal%20-%20Suscripci%C3%B3n'

    return (
        <div className="precios-screen">
            <div className="precios-container">
                {/* Header */}
                <div className="precios-header">
                    <Link to="/login" className="precios-back">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Volver al inicio de sesión
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
                    <p className="precios-note">
                        Todos los planes incluyen acceso completo al corpus CPP PBA (Ley 11.922) y Código Penal.
                        El acceso es activado manualmente — recibirá sus credenciales por correo.
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
                                    <span className="plan-precio-currency">USD</span>
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

                            <a
                                href={mailtoLink + `%20(Plan%20${plan.nombre})`}
                                className={`plan-cta ${plan.destacado ? 'plan-cta--destacado' : ''}`}
                            >
                                {plan.cta}
                            </a>
                        </div>
                    ))}
                </div>

                {/* FAQ / notas */}
                <div className="precios-faq">
                    <h3 className="precios-faq-title">Preguntas frecuentes</h3>
                    <div className="precios-faq-grid">
                        <div className="faq-item">
                            <h4>¿Cómo obtengo acceso?</h4>
                            <p>Enviá un correo al botón de consulta del plan elegido. Studio Lamas te confirma y activa las credenciales en menos de 24 horas hábiles.</p>
                        </div>
                        <div className="faq-item">
                            <h4>¿Qué métodos de pago aceptan?</h4>
                            <p>Transferencia bancaria, Mercado Pago o PayPal. Los precios en USD pueden abonarse en ARS al tipo de cambio del día.</p>
                        </div>
                        <div className="faq-item">
                            <h4>¿Puedo cambiar de plan?</h4>
                            <p>Sí. Podés subir o bajar de plan en cualquier momento contactando a Studio Lamas. El ajuste se aplica al próximo ciclo de facturación.</p>
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
                </div>
            </div>
        </div>
    )
}

export default Precios
