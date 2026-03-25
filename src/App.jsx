import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import PageLayout from './components/PageLayout/PageLayout'
import HeroScreen from './components/HeroScreen/HeroScreen'
import Dashboard from './pages/Dashboard/Dashboard'
import Analizar from './pages/Capacidades/Analizar/Analizar'
import Auditar from './pages/Capacidades/Auditar/Auditar'
import Redactar from './pages/Capacidades/Redactar/Redactar'
import ManualPage from './pages/Manual/Manual'
import Resultado from './pages/Resultado/Resultado'
import Login from './pages/Login/Login'
import Precios from './pages/Precios/Precios'
import Admin from './pages/Admin/Admin'
import Historial from './pages/Historial/Historial'
import ScrollToTop from './components/ScrollToTop'
import DisclaimerAcceptance from './components/DisclaimerAcceptance'
import { isDisclaimerAccepted } from './constants/disclaimer'
import { useAuth } from './context/AuthContext'
import { supabase } from './services/supabase'

// Check if hero was shown this session
const isHeroShown = () => sessionStorage.getItem('alcance_hero_shown') === 'true'
const setHeroShown = () => sessionStorage.setItem('alcance_hero_shown', 'true')

// Si Supabase no está disponible, saltar autenticación
const authEnabled = supabase !== null

// Rutas protegidas: redirige a /login si no hay sesión activa
function RequireAuth({ children }) {
    const { session, loading } = useAuth()
    const location = useLocation()

    if (!authEnabled) return children

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0f172a',
                color: '#64748b',
                fontSize: '0.9rem'
            }}>
                Verificando sesión...
            </div>
        )
    }

    if (!session) {
        return <Navigate to="/login" state={{ from: location }} replace />
    }

    return children
}

function App() {
    const [disclaimerAccepted, setDisclaimerAccepted] = useState(isDisclaimerAccepted())
    const [showHero, setShowHero] = useState(false)

    useEffect(() => {
        const isMobile = window.innerWidth <= 768
        const heroAlreadyShown = isHeroShown()
        if (isMobile && !heroAlreadyShown && disclaimerAccepted) {
            setShowHero(true)
        }
    }, [disclaimerAccepted])

    // Disclaimer obligatorio antes de cualquier uso
    if (!disclaimerAccepted) {
        return (
            <DisclaimerAcceptance
                onAccept={() => setDisclaimerAccepted(true)}
            />
        )
    }

    // Hero screen para móvil (una vez por sesión)
    if (showHero) {
        return (
            <HeroScreen
                onEnter={() => {
                    setHeroShown()
                    setShowHero(false)
                }}
            />
        )
    }

    return (
        <>
            <ScrollToTop />
            <Routes>
                {/* Rutas públicas */}
                <Route path="/login" element={<Login />} />
                <Route path="/precios" element={<Precios />} />

                {/* Rutas protegidas */}
                <Route path="/" element={
                    <RequireAuth>
                        <PageLayout>
                            <Dashboard />
                        </PageLayout>
                    </RequireAuth>
                } />
                <Route path="/analizar" element={
                    <RequireAuth>
                        <PageLayout>
                            <Analizar />
                        </PageLayout>
                    </RequireAuth>
                } />
                <Route path="/auditar" element={
                    <RequireAuth>
                        <PageLayout>
                            <Auditar />
                        </PageLayout>
                    </RequireAuth>
                } />
                <Route path="/redactar" element={
                    <RequireAuth>
                        <PageLayout>
                            <Redactar />
                        </PageLayout>
                    </RequireAuth>
                } />
                <Route path="/manual" element={
                    <RequireAuth>
                        <PageLayout>
                            <ManualPage />
                        </PageLayout>
                    </RequireAuth>
                } />
                <Route path="/resultado" element={
                    <RequireAuth>
                        <PageLayout>
                            <Resultado />
                        </PageLayout>
                    </RequireAuth>
                } />

                <Route path="/historial" element={
                    <RequireAuth>
                        <PageLayout>
                            <Historial />
                        </PageLayout>
                    </RequireAuth>
                } />

                <Route path="/admin" element={
                    <RequireAuth>
                        <PageLayout>
                            <Admin />
                        </PageLayout>
                    </RequireAuth>
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    )
}

export default App
