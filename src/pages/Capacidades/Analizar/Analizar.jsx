import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../../services/api'
import './Analizar.css'

const etapasProcesales = [
    { value: 'ipp', label: 'Investigación Penal Preparatoria (IPP)' },
    { value: 'juicio_oral', label: 'Juicio Oral' },
    { value: 'recursos', label: 'Recursos / Casación' },
    { value: 'ejecucion', label: 'Ejecución de Sentencia' },
]

function Analizar() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        hechos: '',
        tipo_penal: '',
        etapa_procesal: '',
        prueba_acusacion: '',
        pretension_defensiva: '',
    })
    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }))
        }
    }

    const validate = () => {
        const newErrors = {}
        if (!formData.hechos || formData.hechos.trim().length < 20) {
            newErrors.hechos = 'Describa los hechos imputados (mínimo 20 caracteres)'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validate()) return

        setIsLoading(true)
        setErrors({})

        try {
            const response = await api.analizarCaso(formData)

            if (response.success) {
                // Aplanar la respuesta para Resultado.jsx
                const estadoLabels = {
                    approved: 'INFORME APROBADO',
                    limited: 'INFORME CON LIMITACIONES',
                    rejected: 'NO ENTREGABLE',
                }
                navigate('/resultado', {
                    state: {
                        capacidad: 'analizar',
                        data: {
                            ...response.data,
                            estado: estadoLabels[response.status] || 'INFORME',
                            estado_detalle: 'Defensa Penal PBA — In dubio pro reo',
                            _status: response.status,
                            _advertencias: response.advertencias || [],
                            _disclaimer: response.disclaimer,
                            _meta: response.meta,
                        }
                    }
                })
            } else {
                // Rechazo fundado del pipeline (admisibilidad, RAG, validación)
                setErrors({
                    api: response.fundamento || response.recomendacion || 'La consulta no pudo ser procesada.'
                })
            }
        } catch {
            setErrors({ api: 'Error de conexión. Intente nuevamente.' })
        } finally {
            setIsLoading(false)
        }
    }

    const charCount = formData.hechos.length

    return (
        <div className="analizar">
            <header className="analizar__header">
                <button className="analizar__back" onClick={() => navigate('/')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Volver
                </button>
                <h1 className="analizar__title">Analizar Causa Penal</h1>
                <p className="analizar__subtitle">
                    Ingrese los datos de la causa para obtener un análisis de defensa penal basado en el CPP PBA.
                    El sistema razona exclusivamente desde la perspectiva defensiva.
                </p>
            </header>

            <form className="analizar__form" onSubmit={handleSubmit}>

                {/* Hechos Imputados — campo principal, requerido */}
                <div className="form-group">
                    <label className="form-label" htmlFor="hechos">
                        Hechos Imputados <span className="required">*</span>
                    </label>
                    <p className="form-hint">
                        Describa los hechos tal como los plantea la acusación. Incluya: conducta atribuida,
                        víctima/damnificado, fecha aproximada, y norma penal invocada si la conoce.
                    </p>
                    <textarea
                        id="hechos"
                        name="hechos"
                        className={`form-textarea ${errors.hechos ? 'form-textarea--error' : ''}`}
                        rows="6"
                        value={formData.hechos}
                        onChange={handleChange}
                        placeholder="Ej: Se imputa al defendido haber..., en fecha aproximada..., en perjuicio de..., encuadrando la acusación la conducta en el art. ... del Código Penal."
                        disabled={isLoading}
                    />
                    <div className="form-textarea-footer">
                        <span className={`char-count ${charCount < 20 ? 'char-count--warning' : 'char-count--ok'}`}>
                            {charCount}/20 mínimo
                        </span>
                    </div>
                    {errors.hechos && <span className="form-error">{errors.hechos}</span>}
                </div>

                {/* Tipo Penal */}
                <div className="form-group">
                    <label className="form-label" htmlFor="tipo_penal">
                        Tipo Penal / Calificación Provisional
                    </label>
                    <p className="form-hint">
                        Artículo del Código Penal invocado por la acusación (opcional pero recomendado).
                    </p>
                    <input
                        type="text"
                        id="tipo_penal"
                        name="tipo_penal"
                        className="form-input"
                        value={formData.tipo_penal}
                        onChange={handleChange}
                        placeholder="Ej: Art. 119 CP — Abuso sexual con acceso carnal"
                        disabled={isLoading}
                    />
                </div>

                {/* Etapa Procesal */}
                <div className="form-group">
                    <label className="form-label">Etapa Procesal</label>
                    <p className="form-hint">Etapa actual de la causa (opcional).</p>
                    <div className="form-options">
                        {etapasProcesales.map(etapa => (
                            <label
                                key={etapa.value}
                                className={`form-option ${formData.etapa_procesal === etapa.value ? 'form-option--selected' : ''}`}
                            >
                                <input
                                    type="radio"
                                    name="etapa_procesal"
                                    value={etapa.value}
                                    checked={formData.etapa_procesal === etapa.value}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                                <span>{etapa.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Prueba de la Acusación */}
                <div className="form-group">
                    <label className="form-label" htmlFor="prueba_acusacion">
                        Prueba Invocada por la Acusación
                    </label>
                    <p className="form-hint">
                        ¿Qué pruebas presenta la acusación? Testimonio, pericias, documentos, registros digitales, etc.
                    </p>
                    <textarea
                        id="prueba_acusacion"
                        name="prueba_acusacion"
                        className="form-textarea"
                        rows="4"
                        value={formData.prueba_acusacion}
                        onChange={handleChange}
                        placeholder="Ej: Testimonio de la denunciante, pericia médico-forense, capturas de pantalla de mensajes..."
                        disabled={isLoading}
                    />
                </div>

                {/* Pretensión Defensiva */}
                <div className="form-group">
                    <label className="form-label" htmlFor="pretension_defensiva">
                        Pretensión Defensiva
                    </label>
                    <p className="form-hint">
                        ¿Qué busca obtener la defensa? Sobreseimiento, nulidad, absolución, reducción del tipo, etc.
                    </p>
                    <textarea
                        id="pretension_defensiva"
                        name="pretension_defensiva"
                        className="form-textarea"
                        rows="3"
                        value={formData.pretension_defensiva}
                        onChange={handleChange}
                        placeholder="Ej: Sobreseimiento por insuficiencia probatoria, o en subsidio nulidad del allanamiento..."
                        disabled={isLoading}
                    />
                </div>

                {/* Error general */}
                {errors.api && (
                    <div className="form-error-block">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <p>{errors.api}</p>
                    </div>
                )}

                {/* Submit */}
                <div className="form-actions">
                    <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => navigate('/')}
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="btn btn--primary"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Analizando...' : 'Solicitar Análisis'}
                    </button>
                </div>
            </form>

            <footer className="analizar__footer">
                <p>
                    <strong>Nota:</strong> La consulta será evaluada por admisibilidad antes de procesarse.
                    Si involucra materia ajena al fuero penal, será rechazada con fundamentación.
                    El sistema opera exclusivamente en causas penales bajo el CPP PBA.
                </p>
            </footer>
        </div>
    )
}

export default Analizar
