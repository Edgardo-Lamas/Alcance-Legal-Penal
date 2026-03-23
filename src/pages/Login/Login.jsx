import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Login.css'

const ERROR_MAP = {
    'Invalid login credentials': 'Correo o contraseña incorrectos.',
    'Email not confirmed': 'Debe confirmar su correo antes de ingresar. Revise su bandeja de entrada.',
    'User already registered': 'Ya existe una cuenta con ese correo. Ingrese con su contraseña.',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
}

function mapError(msg) {
    return ERROR_MAP[msg] ?? msg
}

const ScaleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18" />
        <path d="M5 6l7-3 7 3" />
        <path d="M5 6v6a7 7 0 0 0 7 7 7 7 0 0 0 7-7V6" />
    </svg>
)

const BrandMark = () => (
    <svg viewBox="0 0 14 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="login-brand-mark">
        <rect x="0" y="0" width="3.5" height="22" rx="1.75" fill="#c9a227"/>
        <rect x="0" y="0" width="11" height="3.5" rx="1.75" fill="#c9a227"/>
        <rect x="0" y="18.5" width="11" height="3.5" rx="1.75" fill="#c9a227"/>
    </svg>
)

function Login() {
    const { signIn, signUp } = useAuth()
    const navigate = useNavigate()

    const [mode, setMode] = useState('ingresar') // 'ingresar' | 'registrar'
    const [nombre, setNombre] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [passwordConfirm, setPasswordConfirm] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [registered, setRegistered] = useState(false)

    const switchMode = (m) => {
        setMode(m)
        setError('')
        setPassword('')
        setPasswordConfirm('')
    }

    const handleIngresar = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        const { error } = await signIn(email, password)
        if (error) {
            setError(mapError(error.message))
            setLoading(false)
        } else {
            navigate('/', { replace: true })
        }
    }

    const handleRegistrar = async (e) => {
        e.preventDefault()
        setError('')

        if (password !== passwordConfirm) {
            setError('Las contraseñas no coinciden.')
            return
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.')
            return
        }

        setLoading(true)
        const { error } = await signUp(email, password, nombre)
        if (error) {
            setError(mapError(error.message))
            setLoading(false)
        } else {
            setRegistered(true)
            setLoading(false)
        }
    }

    // Pantalla de confirmación post-registro
    if (registered) {
        return (
            <div className="login-screen">
                <div className="login-card">
                    <div className="login-header">
                        <div className="login-logo login-logo--success">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h1 className="login-title">Cuenta creada</h1>
                        <p className="login-subtitle">Verifique su correo electrónico</p>
                    </div>
                    <div className="login-confirm-body">
                        <p>Le enviamos un correo de confirmación a:</p>
                        <strong className="login-confirm-email">{email}</strong>
                        <p>Haga clic en el enlace del correo para activar su cuenta y luego ingrese aquí.</p>
                    </div>
                    <button
                        className="login-btn"
                        onClick={() => { setRegistered(false); switchMode('ingresar') }}
                    >
                        Ir al inicio de sesión
                    </button>
                    <div className="login-brand">
                        <BrandMark />
                        <span className="login-brand-text">Studio Lamas · Desarrollo Digital</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="login-screen">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">
                        <ScaleIcon />
                    </div>
                    <h1 className="login-title">Alcance Legal</h1>
                    <p className="login-subtitle">Inteligencia Jurídica Penal · CPP PBA</p>
                </div>

                {/* Toggle */}
                <div className="login-tabs">
                    <button
                        type="button"
                        className={`login-tab ${mode === 'ingresar' ? 'login-tab--active' : ''}`}
                        onClick={() => switchMode('ingresar')}
                    >
                        Ingresar
                    </button>
                    <button
                        type="button"
                        className={`login-tab ${mode === 'registrar' ? 'login-tab--active' : ''}`}
                        onClick={() => switchMode('registrar')}
                    >
                        Crear cuenta
                    </button>
                </div>

                {/* Formulario Ingresar */}
                {mode === 'ingresar' && (
                    <form className="login-form" onSubmit={handleIngresar}>
                        <div className="login-field">
                            <label htmlFor="email" className="login-label">Correo electrónico</label>
                            <input
                                id="email"
                                type="email"
                                className="login-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="abogado@estudio.com"
                                required
                                autoComplete="email"
                            />
                        </div>
                        <div className="login-field">
                            <label htmlFor="password" className="login-label">Contraseña</label>
                            <input
                                id="password"
                                type="password"
                                className="login-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                            />
                        </div>
                        {error && <div className="login-error" role="alert">{error}</div>}
                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Ingresando...' : 'Ingresar al sistema'}
                        </button>
                    </form>
                )}

                {/* Formulario Registrarse */}
                {mode === 'registrar' && (
                    <form className="login-form" onSubmit={handleRegistrar}>
                        <div className="login-field">
                            <label htmlFor="reg-nombre" className="login-label">Nombre completo</label>
                            <input
                                id="reg-nombre"
                                type="text"
                                className="login-input"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                placeholder="Dr. Juan Pérez"
                                autoComplete="name"
                            />
                        </div>
                        <div className="login-field">
                            <label htmlFor="reg-email" className="login-label">Correo electrónico</label>
                            <input
                                id="reg-email"
                                type="email"
                                className="login-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="abogado@estudio.com"
                                required
                                autoComplete="email"
                            />
                        </div>
                        <div className="login-field">
                            <label htmlFor="reg-password" className="login-label">Contraseña</label>
                            <input
                                id="reg-password"
                                type="password"
                                className="login-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                required
                                autoComplete="new-password"
                            />
                        </div>
                        <div className="login-field">
                            <label htmlFor="reg-confirm" className="login-label">Confirmar contraseña</label>
                            <input
                                id="reg-confirm"
                                type="password"
                                className="login-input"
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                                placeholder="Repita la contraseña"
                                required
                                autoComplete="new-password"
                            />
                        </div>
                        {error && <div className="login-error" role="alert">{error}</div>}
                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Creando cuenta...' : 'Crear cuenta gratuita'}
                        </button>
                        <p className="login-terms">
                            Al registrarse acepta los{' '}
                            <button type="button" className="login-terms-link" onClick={() => navigate('/precios')}>
                                términos de uso
                            </button>
                            {' '}del sistema.
                        </p>
                    </form>
                )}

                <div className="login-footer">
                    <p className="login-footer-text">
                        <Link to="/precios" className="login-link">
                            Ver planes de suscripción
                        </Link>
                    </p>
                </div>

                <div className="login-brand">
                    <BrandMark />
                    <span className="login-brand-text">Studio Lamas · Desarrollo Digital</span>
                </div>
            </div>
        </div>
    )
}

export default Login
