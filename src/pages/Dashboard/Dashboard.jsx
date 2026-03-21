import { useNavigate } from 'react-router-dom'
import './Dashboard.css'

const capacidades = [
    {
        id: 'analizar',
        titulo: 'Analizar Causa Penal',
        descripcion: 'Análisis defensivo integral del caso: encuadre procesal, prueba de cargo, nulidades y conclusión fundada.',
        icon: 'analyze',
        materias: ['Prisión Preventiva', 'Nulidades', 'Prueba de Cargo', 'Sobreseimiento', 'Calificación'],
        ruta: '/analizar'
    },
    {
        id: 'auditar',
        titulo: 'Auditar Estrategia',
        descripcion: 'Evaluación de la estrategia defensiva, detección de inconsistencias y puntos débiles ante la acusación.',
        icon: 'audit',
        materias: ['IPP', 'Juicio Oral', 'Apelación', 'Casación', 'Ejecución'],
        ruta: '/auditar'
    },
    {
        id: 'redactar',
        titulo: 'Redactar Escrito de Defensa',
        descripcion: 'Asistencia para redacción de escritos penales con criterios del CPP PBA y metodología defensiva curada.',
        icon: 'draft',
        materias: ['Apelación', 'Excepción', 'Nulidad', 'Excarcelación', 'Alegato'],
        ruta: '/redactar',
        badge: 'Borrador Asistido'
    }
]

const principios = [
    {
        id: 'indubio',
        simbolo: 'I',
        nombre: 'In dubio pro reo',
        descripcion: 'La duda razonable beneficia al imputado. Siempre.'
    },
    {
        id: 'inocencia',
        simbolo: 'II',
        nombre: 'Presunción de inocencia',
        descripcion: 'El imputado es inocente hasta sentencia firme.'
    },
    {
        id: 'carga',
        simbolo: 'III',
        nombre: 'Carga de la prueba',
        descripcion: 'Corresponde exclusivamente a la acusación.'
    },
    {
        id: 'proceso',
        simbolo: 'IV',
        nombre: 'Debido proceso',
        descripcion: 'Toda violación a garantías procesales es argumento defensivo.'
    }
]

const icons = {
    analyze: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
            <path d="M11 8v6" />
            <path d="M8 11h6" />
        </svg>
    ),
    audit: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
    ),
    draft: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    )
}

function Dashboard() {
    const navigate = useNavigate()

    return (
        <div className="dashboard">
            <header className="dashboard__header">
                <div className="dashboard__perfil-badge">CPP PBA · Defensa Penal</div>
                <h1 className="dashboard__title">Consola de Criterio Jurídico</h1>
                <p className="dashboard__subtitle">
                    Sistema de inteligencia jurídica — perspectiva exclusivamente defensiva
                </p>
            </header>

            <section className="dashboard__principios">
                <p className="dashboard__principios-label">Principios rectores irrenunciables</p>
                <div className="dashboard__principios-grid">
                    {principios.map((p) => (
                        <div key={p.id} className="principio-item">
                            <span className="principio-item__simbolo">{p.simbolo}</span>
                            <div className="principio-item__texto">
                                <strong>{p.nombre}</strong>
                                <span>{p.descripcion}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <div className="dashboard__aviso">
                <span className="dashboard__aviso-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </span>
                <p>
                    Este sistema opera exclusivamente en el <strong>Fuero Penal (CPP PBA)</strong>.
                    Consultas de otros fueros serán rechazadas.
                </p>
            </div>

            <div className="dashboard__grid">
                {capacidades.map((cap) => (
                    <article
                        key={cap.id}
                        className="capacidad-card"
                        onClick={() => navigate(cap.ruta)}
                    >
                        <div className="capacidad-card__header">
                            <div className="capacidad-card__icon">
                                {icons[cap.icon]}
                            </div>
                            {cap.badge && (
                                <span className="capacidad-card__badge">{cap.badge}</span>
                            )}
                        </div>

                        <h2 className="capacidad-card__titulo">{cap.titulo}</h2>
                        <p className="capacidad-card__descripcion">{cap.descripcion}</p>

                        <div className="capacidad-card__materias">
                            {cap.materias.map((materia) => (
                                <span key={materia} className="capacidad-card__materia">
                                    {materia}
                                </span>
                            ))}
                        </div>

                        <div className="capacidad-card__action">
                            <span>Iniciar consulta</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </div>
                    </article>
                ))}
            </div>

            <footer className="dashboard__footer">
                <p>
                    Alcance Legal Penal prioriza <strong>criterio defensivo</strong> sobre velocidad de respuesta.
                    Un rechazo fundado es siempre preferible a una respuesta improvisada.
                </p>
            </footer>

            <div className="dashboard__aviso-legal">
                <p className="dashboard__aviso-legal-titulo">Aviso Legal</p>
                <p>
                    Este sistema es un <strong>insumo técnico de asistencia profesional</strong>, no un consejo legal definitivo.
                    Opera exclusivamente desde la perspectiva de la defensa penal en el fuero provincial de Buenos Aires
                    (CPP PBA — Ley 11.922 / Código Penal de la Nación). La estrategia procesal y la decisión final
                    corresponden exclusivamente al abogado defensor actuante.
                </p>
            </div>
        </div>
    )
}

export default Dashboard
