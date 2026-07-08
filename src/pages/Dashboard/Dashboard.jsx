import { useNavigate } from 'react-router-dom'
import { useExtensionDetect } from '../../hooks/useExtensionDetect'
import './Dashboard.css'

const CHROME_STORE_URL = 'https://chromewebstore.google.com/detail/alcance-legal-penal-%C2%B7-con/gojomcbmgkmmnknihfldaccogebhppfd'

const principios = [
    { simbolo: 'I',   nombre: 'In dubio pro reo',        descripcion: 'La duda razonable beneficia siempre al imputado' },
    { simbolo: 'II',  nombre: 'Presunción de inocencia', descripcion: 'El imputado es inocente hasta sentencia firme' },
    { simbolo: 'III', nombre: 'Carga de la prueba',      descripcion: 'Corresponde exclusivamente a la acusación' },
    { simbolo: 'IV',  nombre: 'Debido proceso',          descripcion: 'Toda violación a garantías es argumento defensivo' },
]

const IconAnalizar = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        <path d="M11 8v6"/><path d="M8 11h6"/>
    </svg>
)
const IconAuditar = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
    </svg>
)
const IconRedactar = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
)
const IconArrow = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
)
const IconShield = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
)
const IconMonitor = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
    </svg>
)
const IconWarning = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
)

function Dashboard() {
    const navigate = useNavigate()
    const mevInstalado = useExtensionDetect()

    return (
        <div className="dashboard">

            {/* ── Banner MEV ── */}
            {mevInstalado ? (
                <div className="mev-banner mev-banner--activo">
                    <span className="mev-banner__dot" />
                    <span className="mev-banner__texto">
                        Conexión MEV activa — el sistema detecta expedientes automáticamente
                    </span>
                    <a href="https://mev.scba.gov.ar" target="_blank" rel="noreferrer" className="mev-banner__btn">
                        Abrir mi MEV →
                    </a>
                </div>
            ) : (
                <div className="mev-banner mev-banner--setup">
                    <div className="mev-banner__izq">
                        <IconMonitor />
                        <div>
                            <strong>Activar conexión con el MEV</strong>
                            <span>Instalá el componente de Alcance Legal Penal en Chrome para analizar expedientes sin copiar texto</span>
                        </div>
                    </div>
                    <a href={CHROME_STORE_URL} target="_blank" rel="noreferrer" className="mev-banner__btn">
                        Activar en Chrome →
                    </a>
                </div>
            )}

            {/* ── Hero Header ── */}
            <header className="dashboard__hero">
                <div>
                    <div className="dashboard__hero-badge">
                        <IconShield />
                        <span>CPP PBA · Defensa Penal · Buenos Aires</span>
                    </div>
                    <span className="dashboard__hero-status">
                        <span className="dashboard__hero-status-dot" />
                        Sistema activo
                    </span>
                </div>
                <h1 className="dashboard__hero-title">
                    Consola de Criterio<br />
                    <em>Jurídico</em>
                </h1>
                <p className="dashboard__hero-subtitle">
                    Sistema de inteligencia jurídica — perspectiva exclusivamente defensiva
                </p>

                {/* Principios como pills horizontales */}
                <div className="dashboard__principios-pills">
                    {principios.map((p) => (
                        <div key={p.simbolo} className="principio-pill" title={p.descripcion}>
                            <span className="principio-pill__num">{p.simbolo}</span>
                            <span className="principio-pill__nombre">{p.nombre}</span>
                        </div>
                    ))}
                </div>
            </header>

            {/* ── Aviso de Fuero ── */}
            <div className="dashboard__aviso">
                <span className="dashboard__aviso-icon"><IconWarning /></span>
                <p>
                    Este sistema opera exclusivamente en el <strong>Fuero Penal (CPP PBA)</strong>.
                    Consultas de otros fueros serán rechazadas.
                </p>
            </div>

            {/* ── Bento Grid ── */}
            <div className="dashboard__bento">

                {/* Card grande — Analizar */}
                <article className="bento-card bento-card--primary" data-num="01" onClick={() => navigate('/analizar')}>
                    <div className="bento-card__dot-pattern" />
                    <div className="bento-card__glow" />
                    <div className="bento-card__top">
                        <div className="bento-card__icon bento-card__icon--lg">
                            <span className="bento-card__icon-inner"><IconAnalizar /></span>
                        </div>
                        <div className="bento-card__meta">
                            <span className="bento-card__tag">Principal</span>
                        </div>
                    </div>
                    <div className="bento-card__body">
                        <h2 className="bento-card__titulo">Analizar<br />Causa Penal</h2>
                        <p className="bento-card__descripcion">
                            Análisis defensivo integral: encuadre procesal, prueba de cargo,
                            nulidades y conclusión fundada desde la perspectiva de la defensa.
                        </p>
                    </div>
                    <div className="bento-card__tags">
                        {['Prisión Preventiva', 'Nulidades', 'Prueba de Cargo', 'Sobreseimiento', 'Calificación'].map(t => (
                            <span key={t} className="bento-card__tag-item">{t}</span>
                        ))}
                    </div>
                    <div className="bento-card__action">
                        <span>Iniciar análisis</span>
                        <IconArrow />
                    </div>
                </article>

                {/* Card mediana — Auditar */}
                <article className="bento-card bento-card--secondary" data-num="02" onClick={() => navigate('/auditar')}>
                    <div className="bento-card__dot-pattern" />
                    <div className="bento-card__top">
                        <div className="bento-card__icon">
                            <span className="bento-card__icon-inner"><IconAuditar /></span>
                        </div>
                    </div>
                    <div className="bento-card__body">
                        <h2 className="bento-card__titulo">Auditar<br />Estrategia</h2>
                        <p className="bento-card__descripcion">
                            Evaluación de la estrategia defensiva, detección de inconsistencias
                            y puntos débiles ante la acusación.
                        </p>
                    </div>
                    <div className="bento-card__tags">
                        {['IPP', 'Juicio Oral', 'Apelación', 'Casación'].map(t => (
                            <span key={t} className="bento-card__tag-item">{t}</span>
                        ))}
                    </div>
                    <div className="bento-card__action">
                        <span>Auditar</span>
                        <IconArrow />
                    </div>
                </article>

                {/* Card mediana — Redactar */}
                <article className="bento-card bento-card--secondary" data-num="03" onClick={() => navigate('/redactar')}>
                    <div className="bento-card__dot-pattern" />
                    <div className="bento-card__top">
                        <div className="bento-card__icon">
                            <span className="bento-card__icon-inner"><IconRedactar /></span>
                        </div>
                        <span className="bento-card__badge">Borrador Asistido</span>
                    </div>
                    <div className="bento-card__body">
                        <h2 className="bento-card__titulo">Redactar<br />Escrito</h2>
                        <p className="bento-card__descripcion">
                            Asistencia para redacción de escritos penales con criterios
                            del CPP PBA y metodología defensiva curada.
                        </p>
                    </div>
                    <div className="bento-card__tags">
                        {['Apelación', 'Nulidad', 'Excarcelación', 'Alegato'].map(t => (
                            <span key={t} className="bento-card__tag-item">{t}</span>
                        ))}
                    </div>
                    <div className="bento-card__action">
                        <span>Redactar</span>
                        <IconArrow />
                    </div>
                </article>

            </div>

            {/* ── Footer / Disclaimer ── */}
            <footer className="dashboard__footer">
                <p className="dashboard__footer-filosofia">
                    Alcance Legal Penal prioriza <strong>criterio defensivo</strong> sobre velocidad de respuesta.
                    Un rechazo fundado es siempre preferible a una respuesta improvisada.
                </p>
                <div className="dashboard__aviso-legal">
                    <span className="dashboard__aviso-legal-titulo">Aviso Legal</span>
                    <p>
                        Este sistema es un <strong>insumo técnico de asistencia profesional</strong>, no un consejo legal definitivo.
                        Opera exclusivamente desde la perspectiva de la defensa penal en el fuero provincial de Buenos Aires
                        (CPP PBA — Ley 11.922 / Código Penal de la Nación). La estrategia procesal y la decisión final
                        corresponden exclusivamente al abogado defensor actuante.
                    </p>
                </div>
            </footer>

        </div>
    )
}

export default Dashboard
