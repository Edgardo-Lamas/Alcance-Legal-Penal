import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../services/supabase'
import './Admin.css'

// Agrupa profiles por semana (últimas N semanas)
function agruparPorSemana(profiles, numSemanas = 8) {
    const ahora = new Date()
    const semanas = []

    for (let i = numSemanas - 1; i >= 0; i--) {
        const desde = new Date(ahora)
        desde.setDate(desde.getDate() - (i + 1) * 7)
        desde.setHours(0, 0, 0, 0)

        const hasta = new Date(ahora)
        hasta.setDate(hasta.getDate() - i * 7)
        hasta.setHours(23, 59, 59, 999)

        const count = profiles.filter(p => {
            const d = new Date(p.created_at)
            return d >= desde && d <= hasta
        }).length

        // Label: fecha del lunes de esa semana
        const label = desde.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
        semanas.push({ label, count, estaActual: i === 0 })
    }

    return semanas
}

function StatCard({ valor, etiqueta, destacado }) {
    return (
        <div className={`stat-card ${destacado ? 'stat-card--destacado' : ''}`}>
            <span className="stat-card__valor">{valor}</span>
            <span className="stat-card__etiqueta">{etiqueta}</span>
        </div>
    )
}

function Admin() {
    const { isAdmin, loading } = useAuth()
    const navigate = useNavigate()
    const [profiles, setProfiles] = useState([])
    const [loadingData, setLoadingData] = useState(true)
    const [error, setError] = useState(null)

    // Guard: si no es admin, redirigir
    useEffect(() => {
        if (!loading && !isAdmin) {
            navigate('/', { replace: true })
        }
    }, [isAdmin, loading, navigate])

    // Fetch profiles
    useEffect(() => {
        if (!isAdmin || !supabase) return

        supabase
            .from('profiles')
            .select('id, nombre, email, created_at, analisis_count, is_admin')
            .order('created_at', { ascending: false })
            .then(({ data, error }) => {
                if (error) setError(error.message)
                else setProfiles(data || [])
                setLoadingData(false)
            })
    }, [isAdmin])

    if (loading || loadingData) {
        return (
            <div className="admin-loading">
                <div className="admin-loading__spinner" />
                <span>Cargando datos...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="admin-error">
                Error al cargar datos: {error}
            </div>
        )
    }

    // Estadísticas
    const ahora = new Date()
    const hace7dias = new Date(ahora - 7 * 24 * 60 * 60 * 1000)

    const stats = {
        total: profiles.length,
        nuevos7dias: profiles.filter(p => new Date(p.created_at) > hace7dias).length,
        totalAnalisis: profiles.reduce((acc, p) => acc + (p.analisis_count || 0), 0),
        usuariosActivos: profiles.filter(p => (p.analisis_count || 0) > 0).length,
    }

    // Chart
    const semanas = agruparPorSemana(profiles, 8)
    const maxSemana = Math.max(...semanas.map(s => s.count), 1)

    return (
        <div className="admin">
            {/* Header */}
            <div className="admin__header">
                <div>
                    <h1 className="admin__title">Panel de Administración</h1>
                    <p className="admin__subtitle">Métricas de la beta · Alcance Legal Penal</p>
                </div>
                <span className="admin__badge">ADMIN</span>
            </div>

            {/* Stats */}
            <div className="admin__stats">
                <StatCard valor={stats.total} etiqueta="Total registrados" />
                <StatCard valor={stats.nuevos7dias} etiqueta="Nuevos (7 días)" destacado={stats.nuevos7dias > 0} />
                <StatCard valor={stats.totalAnalisis} etiqueta="Análisis enviados" />
                <StatCard valor={stats.usuariosActivos} etiqueta="Usuarios activos" />
            </div>

            {/* Chart */}
            <div className="admin__section">
                <h2 className="admin__section-title">Registros por semana</h2>
                <div className="admin__chart">
                    {semanas.map((s, i) => (
                        <div key={i} className="chart-col">
                            <span className="chart-col__count">{s.count > 0 ? s.count : ''}</span>
                            <div className="chart-col__track">
                                <div
                                    className={`chart-col__bar ${s.estaActual ? 'chart-col__bar--actual' : ''}`}
                                    style={{ height: `${(s.count / maxSemana) * 100}%` }}
                                />
                            </div>
                            <span className="chart-col__label">{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="admin__section">
                <h2 className="admin__section-title">
                    Usuarios registrados
                    <span className="admin__count-badge">{profiles.length}</span>
                </h2>
                <div className="admin__table-wrap">
                    <table className="admin__table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Registrado</th>
                                <th>Análisis</th>
                                <th>Rol</th>
                            </tr>
                        </thead>
                        <tbody>
                            {profiles.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="admin__empty">
                                        Sin usuarios registrados todavía
                                    </td>
                                </tr>
                            )}
                            {profiles.map(p => (
                                <tr key={p.id}>
                                    <td className="admin__td-nombre">{p.nombre || <span className="admin__nd">—</span>}</td>
                                    <td className="admin__td-email">{p.email}</td>
                                    <td className="admin__td-fecha">
                                        {new Date(p.created_at).toLocaleDateString('es-AR', {
                                            day: '2-digit', month: '2-digit', year: '2-digit'
                                        })}
                                    </td>
                                    <td className={`admin__td-count ${(p.analisis_count || 0) > 0 ? 'admin__td-count--activo' : ''}`}>
                                        {p.analisis_count || 0}
                                    </td>
                                    <td>
                                        {p.is_admin
                                            ? <span className="admin__rol admin__rol--admin">Admin</span>
                                            : <span className="admin__rol admin__rol--user">Beta</span>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default Admin
