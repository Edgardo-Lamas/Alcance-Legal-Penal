import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import DisclaimerModal from '../DisclaimerModal'
import { useAuth } from '../../context/AuthContext'
import { usePWAInstall } from '../../hooks/usePWAInstall'
import './Navigation.css'

const navItems = [
    { path: '/', label: 'Consola', icon: 'dashboard', exact: true },
    { path: '/analizar', label: 'Analizar Caso', icon: 'analyze' },
    { path: '/auditar', label: 'Auditar Estrategia', icon: 'audit' },
    { path: '/redactar', label: 'Redactar Escrito', icon: 'draft' },
    { path: '/historial', label: 'Historial', icon: 'historial' },
    { path: '/manual', label: 'Manual y Ayuda', icon: 'help' },
]

const icons = {
    dashboard: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
        </svg>
    ),
    analyze: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
            <path d="M11 8v6" />
            <path d="M8 11h6" />
        </svg>
    ),
    audit: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    ),
    draft: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    ),
    menu: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
    ),
    close: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    scale: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v18" />
            <path d="M5 6l7-3 7 3" />
            <path d="M5 6v6a7 7 0 0 0 7 7 7 7 0 0 0 7-7V6" />
        </svg>
    ),
    historial: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    help: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
}

function Navigation() {
    const [isOpen, setIsOpen] = useState(false)
    const [showDisclaimer, setShowDisclaimer] = useState(false)
    const { user, signOut, isAdmin } = useAuth()
    const navigate = useNavigate()
    const { puedeInstalar, instalar } = usePWAInstall()

    const toggleNav = () => setIsOpen(!isOpen)
    const closeNav = () => setIsOpen(false)

    const handleSignOut = async () => {
        closeNav()
        await signOut()
        navigate('/login', { replace: true })
    }

    return (
        <>
            <button className="navigation__toggle" onClick={toggleNav} aria-label="Toggle navigation">
                {isOpen ? icons.close : icons.menu}
            </button>

            <nav className={`navigation ${isOpen ? 'navigation--open' : ''}`}>
                <div className="navigation__header">
                    <div className="navigation__logo">
                        {icons.scale}
                    </div>
                    <h1 className="navigation__title">Alcance Legal</h1>
                    <p className="navigation__subtitle">Inteligencia Jurídica Penal</p>
                </div>

                <div className="navigation__section">
                    <span className="navigation__section-label">Capacidades</span>
                    <ul className="navigation__menu">
                        {navItems.map((item) => (
                            <li key={item.path} className="navigation__item">
                                <NavLink
                                    to={item.path}
                                    end={item.exact}
                                    className={({ isActive }) =>
                                        `navigation__link ${isActive ? 'navigation__link--active' : ''}`
                                    }
                                    onClick={closeNav}
                                >
                                    <span className="navigation__icon">{icons[item.icon]}</span>
                                    {item.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>

                {isAdmin && (
                    <div className="navigation__section navigation__section--admin">
                        <span className="navigation__section-label">Administración</span>
                        <ul className="navigation__menu">
                            <li className="navigation__item">
                                <NavLink
                                    to="/admin"
                                    className={({ isActive }) =>
                                        `navigation__link navigation__link--admin ${isActive ? 'navigation__link--active' : ''}`
                                    }
                                    onClick={closeNav}
                                >
                                    <span className="navigation__icon">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M3 3h7v7H3z" /><path d="M14 3h7v7h-7z" /><path d="M14 14h7v7h-7z" /><path d="M3 14h7v7H3z" />
                                        </svg>
                                    </span>
                                    Panel Admin
                                </NavLink>
                            </li>
                        </ul>
                    </div>
                )}

                <div className="navigation__footer">
                    {user && (
                        <div className="navigation__user">
                            <span className="navigation__user-email">{user.email}</span>
                            <button className="navigation__signout" onClick={handleSignOut}>
                                Cerrar sesión
                            </button>
                        </div>
                    )}
                    <button
                        className="navigation__legal-link"
                        onClick={() => setShowDisclaimer(true)}
                    >
                        Ver Aviso Legal
                    </button>
                    {puedeInstalar && (
                        <button className="navigation__install-btn" onClick={instalar}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            Instalar en escritorio
                        </button>
                    )}
                    <div className="navigation__badge">Fuero Penal · CPP PBA</div>
                    <span className="navigation__version">v1.0.0</span>
                    <span className="navigation__copyright">© 2026 Edgardo Lamas</span>

                    {/* Firma del estudio */}
                    <div className="navigation__brand">
                        <div className="navigation__brand-mark" aria-hidden="true">
                            <svg viewBox="0 0 14 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="0" y="0" width="3.5" height="22" rx="1.75" fill="#c9a227"/>
                                <rect x="0" y="0" width="11" height="3.5" rx="1.75" fill="#c9a227"/>
                                <rect x="0" y="18.5" width="11" height="3.5" rx="1.75" fill="#c9a227"/>
                            </svg>
                        </div>
                        <div className="navigation__brand-text">
                            <span className="navigation__brand-name">Studio Lamas</span>
                            <span className="navigation__brand-tagline">Desarrollo Digital</span>
                        </div>
                    </div>
                </div>
            </nav>

            {isOpen && <div className="navigation__overlay" onClick={closeNav} />}

            <DisclaimerModal
                isOpen={showDisclaimer}
                onClose={() => setShowDisclaimer(false)}
            />
        </>
    )
}

export default Navigation
