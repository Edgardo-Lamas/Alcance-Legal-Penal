import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { api } from '../../../services/api'
import { mapearEtapa, parseCaratula } from '../../../utils/precargaAnalisis'
import '../Analizar/Analizar.css'

const etapasProcesales = [
    { value: 'ipp', label: 'IPP — Invest. Penal Preparatoria' },
    { value: 'intermedia', label: 'Etapa Intermedia' },
    { value: 'juicio_oral', label: 'Juicio Oral' },
    { value: 'recursos', label: 'Recursos / Casación' },
    { value: 'ejecucion_pena', label: 'Ejecución de Pena' },
]

const situacionesProcesales = [
    { value: 'libre', label: 'En libertad' },
    { value: 'detenido', label: 'Detenido / PP vigente' },
    { value: 'domiciliaria', label: 'Detención domiciliaria' },
]

function Auditar() {
    const navigate = useNavigate()
    const location = useLocation()
    // Datos del análisis previo (botón "Auditar Estrategia" del informe). La
    // estrategia y el objetivo son siempre del abogado — solo se precarga lo
    // que ya extrajo el sistema del expediente.
    const desdeAnalisis = location.state?.desdeAnalisis
    // Si el análisis no trae etapa/delito estructurados, se extraen del texto de hechos
    const caratula = parseCaratula(desdeAnalisis?.hechos)
    const sinDato = (v) => !v || /^no especificad/i.test(v.trim()) ? '' : v
    const [formData, setFormData] = useState({
        etapa_procesal: mapearEtapa(sinDato(desdeAnalisis?.etapa_procesal) || caratula.etapa),
        tipo_delito_imputado: sinDato(desdeAnalisis?.tipo_penal) || caratula.delito,
        situacion_procesal: '',
        estrategia_actual: '',
        objetivo_defensivo: '',
        riesgos_identificados: '',
        contexto_adicional: desdeAnalisis?.hechos || ''
    })
    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
    }

    const validate = () => {
        const newErrors = {}
        if (!formData.etapa_procesal)
            newErrors.etapa_procesal = 'Seleccione la etapa procesal'
        if (!formData.situacion_procesal)
            newErrors.situacion_procesal = 'Seleccione la situación del imputado'
        if (!formData.estrategia_actual || formData.estrategia_actual.length < 150)
            newErrors.estrategia_actual = 'Describa la estrategia defensiva (mínimo 150 caracteres)'
        if (!formData.objetivo_defensivo)
            newErrors.objetivo_defensivo = 'Indique el objetivo defensivo concreto'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validate()) return
        setIsLoading(true)
        setErrors({})
        try {
            const response = await api.auditarEstrategia(formData)
            if (response.success) {
                navigate('/resultado', { state: { capacidad: 'auditar', data: response.data } })
            } else {
                setErrors({ api: response.error || response.fundamento || 'Error al procesar la consulta' })
            }
        } catch {
            setErrors({ api: 'Error de conexión. Intente nuevamente.' })
        } finally {
            setIsLoading(false)
        }
    }

    const charCount = formData.estrategia_actual.length

    return (
        <div className="analizar">
            <header className="analizar__header">
                <button className="analizar__back" onClick={() => navigate('/')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Volver
                </button>
                <h1 className="analizar__title">Auditar Estrategia Defensiva</h1>
                <p className="analizar__subtitle">
                    Detecte supuestos implícitos, inconsistencias y riesgos en su estrategia de defensa penal PBA.
                </p>
            </header>

            {desdeAnalisis && (
                <div className="precarga-banner">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <p>
                        Datos del expediente precargados desde el análisis <strong>{desdeAnalisis.numero_informe}</strong>.
                        La estrategia y el objetivo defensivo los completa usted — el sistema no los deduce.
                    </p>
                </div>
            )}

            <form className="analizar__form" onSubmit={handleSubmit}>

                {/* Etapa Procesal */}
                <div className="form-group">
                    <label className="form-label">
                        Etapa Procesal <span className="required">*</span>
                    </label>
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
                                />
                                <span>{etapa.label}</span>
                            </label>
                        ))}
                    </div>
                    {errors.etapa_procesal && <span className="form-error">{errors.etapa_procesal}</span>}
                </div>

                {/* Situación del imputado */}
                <div className="form-group">
                    <label className="form-label">
                        Situación del Imputado <span className="required">*</span>
                    </label>
                    <div className="form-options">
                        {situacionesProcesales.map(sit => (
                            <label
                                key={sit.value}
                                className={`form-option ${formData.situacion_procesal === sit.value ? 'form-option--selected' : ''}`}
                            >
                                <input
                                    type="radio"
                                    name="situacion_procesal"
                                    value={sit.value}
                                    checked={formData.situacion_procesal === sit.value}
                                    onChange={handleChange}
                                />
                                <span>{sit.label}</span>
                            </label>
                        ))}
                    </div>
                    {errors.situacion_procesal && <span className="form-error">{errors.situacion_procesal}</span>}
                </div>

                {/* Tipo de delito imputado */}
                <div className="form-group">
                    <label className="form-label" htmlFor="tipo_delito_imputado">
                        Delito Imputado
                    </label>
                    <p className="form-hint">
                        Norma o tipo penal que la acusación aplica (opcional pero recomendado).
                    </p>
                    <input
                        id="tipo_delito_imputado"
                        name="tipo_delito_imputado"
                        type="text"
                        className="form-input"
                        value={formData.tipo_delito_imputado}
                        onChange={handleChange}
                        placeholder="Ej: Art. 119 CP (abuso sexual), art. 164 CP (robo), art. 89 CP (lesiones leves)..."
                    />
                </div>

                {/* Estrategia defensiva actual */}
                <div className="form-group">
                    <label className="form-label" htmlFor="estrategia_actual">
                        Estrategia Defensiva Actual <span className="required">*</span>
                    </label>
                    <p className="form-hint">
                        Describa su enfoque estratégico: líneas argumentales, prueba a ofrecer, planteos de nulidad, orden de presentación.
                    </p>
                    <textarea
                        id="estrategia_actual"
                        name="estrategia_actual"
                        className={`form-textarea ${errors.estrategia_actual ? 'form-textarea--error' : ''}`}
                        rows="7"
                        value={formData.estrategia_actual}
                        onChange={handleChange}
                        placeholder="Ej: La defensa plantea la nulidad del procedimiento de detención por ausencia de flagrancia real (art. 151 CPP PBA). Como consecuencia, solicita la exclusión de la prueba obtenida (art. 211 CPP PBA). Subsidiariamente, cuestiona la suficiencia probatoria del testimonio único sin corroboración periférica..."
                    />
                    <div className="form-textarea-footer">
                        <span className={`char-count ${charCount < 150 ? 'char-count--warning' : 'char-count--ok'}`}>
                            {charCount}/150 mínimo
                        </span>
                    </div>
                    {errors.estrategia_actual && <span className="form-error">{errors.estrategia_actual}</span>}
                </div>

                {/* Objetivo defensivo */}
                <div className="form-group">
                    <label className="form-label" htmlFor="objetivo_defensivo">
                        Objetivo Defensivo Concreto <span className="required">*</span>
                    </label>
                    <p className="form-hint">
                        ¿Qué resultado busca obtener con esta estrategia?
                    </p>
                    <textarea
                        id="objetivo_defensivo"
                        name="objetivo_defensivo"
                        className={`form-textarea ${errors.objetivo_defensivo ? 'form-textarea--error' : ''}`}
                        rows="3"
                        value={formData.objetivo_defensivo}
                        onChange={handleChange}
                        placeholder="Ej: Sobreseimiento definitivo por insuficiencia probatoria (art. 323 inc. 3 CPP PBA) / Nulidad del allanamiento y exclusión de prueba obtenida / Absolución en juicio oral / Morigeración de la prisión preventiva..."
                    />
                    {errors.objetivo_defensivo && <span className="form-error">{errors.objetivo_defensivo}</span>}
                </div>

                {/* Riesgos ya identificados */}
                <div className="form-group">
                    <label className="form-label" htmlFor="riesgos_identificados">
                        Riesgos Ya Identificados
                    </label>
                    <p className="form-hint">
                        ¿Qué debilidades o riesgos ya contempla en su estrategia?
                    </p>
                    <textarea
                        id="riesgos_identificados"
                        name="riesgos_identificados"
                        className="form-textarea"
                        rows="3"
                        value={formData.riesgos_identificados}
                        onChange={handleChange}
                        placeholder="Ej: El testimonio de la víctima es persistente; hay pericia psicológica oficial favorable a la acusación; el imputado no tiene coartada acreditada..."
                    />
                </div>

                {/* Contexto adicional */}
                <div className="form-group">
                    <label className="form-label" htmlFor="contexto_adicional">
                        Contexto Adicional
                    </label>
                    <p className="form-hint">
                        Información relevante que no encaja en los campos anteriores.
                    </p>
                    <textarea
                        id="contexto_adicional"
                        name="contexto_adicional"
                        className="form-textarea"
                        rows="3"
                        value={formData.contexto_adicional}
                        onChange={handleChange}
                        placeholder="Juzgado interviniente, particularidades del caso, antecedentes del imputado, presión mediática, plazo de PP..."
                    />
                </div>

                {errors.api && (
                    <div className="form-error form-error--api">{errors.api}</div>
                )}

                <div className="form-actions">
                    <button type="button" className="btn btn--secondary" onClick={() => navigate('/')}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn--primary" disabled={isLoading}>
                        {isLoading ? 'Auditando estrategia...' : 'Solicitar Auditoría Defensiva'}
                    </button>
                </div>
            </form>

            <footer className="analizar__footer">
                <p>
                    <strong>Nota:</strong> El sistema detectará supuestos implícitos, inconsistencias lógicas
                    y riesgos no contemplados, razonando siempre desde la perspectiva defensiva (in dubio pro reo).
                </p>
            </footer>
        </div>
    )
}

export default Auditar
