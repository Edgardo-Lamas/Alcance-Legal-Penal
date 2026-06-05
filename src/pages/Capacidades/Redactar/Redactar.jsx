import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../../services/api'
import '../Analizar/Analizar.css'

const tiposEscrito = [
    { value: 'excarcelacion', label: 'Excarcelación / Morigeración PP' },
    { value: 'apelacion_pp', label: 'Apelación de Prisión Preventiva' },
    { value: 'nulidad', label: 'Planteo de Nulidad Procesal' },
    { value: 'habeas_corpus', label: 'Hábeas Corpus' },
    { value: 'sobreseimiento', label: 'Solicitud de Sobreseimiento' },
    { value: 'recurso_casacion', label: 'Recurso de Casación Penal' },
]

function Redactar() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        tipo_escrito: '',
        nombre_imputado: '',
        causa_numero: '',
        hechos_relevantes: '',
        pretension_defensiva: '',
        fundamentos_extra: '',
        incluir_citas_scba: true
    })
    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }))
    }

    const validate = () => {
        const newErrors = {}
        if (!formData.tipo_escrito)
            newErrors.tipo_escrito = 'Seleccione el tipo de escrito'
        if (!formData.nombre_imputado)
            newErrors.nombre_imputado = 'Ingrese el nombre del imputado/a'
        if (!formData.hechos_relevantes || formData.hechos_relevantes.length < 200)
            newErrors.hechos_relevantes = 'Describa los hechos relevantes (mínimo 200 caracteres)'
        if (!formData.pretension_defensiva)
            newErrors.pretension_defensiva = 'Indique la pretensión concreta'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validate()) return
        setIsLoading(true)
        setErrors({})
        try {
            const response = await api.redactarEscrito(formData)
            if (response.success) {
                navigate('/resultado', { state: { capacidad: 'redactar', data: response.data } })
            } else {
                setErrors({ api: response.error || response.fundamento || 'Error al procesar la consulta' })
            }
        } catch {
            setErrors({ api: 'Error de conexión. Intente nuevamente.' })
        } finally {
            setIsLoading(false)
        }
    }

    const charCount = formData.hechos_relevantes.length

    return (
        <div className="analizar">
            <header className="analizar__header">
                <button className="analizar__back" onClick={() => navigate('/')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Volver
                </button>
                <h1 className="analizar__title">Redactar Escrito de Defensa</h1>
                <p className="analizar__subtitle">
                    Genera un borrador de escrito penal con formato judicial PBA. Exportable a Word para edición y presentación.
                </p>
            </header>

            <div className="redactar__aviso">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <p>
                    <strong>BORRADOR ASISTIDO</strong> — El resultado es un escrito editable (.docx) que requiere
                    revisión y firma del letrado responsable antes de su presentación judicial.
                </p>
            </div>

            <form className="analizar__form" onSubmit={handleSubmit}>

                {/* Tipo de Escrito */}
                <div className="form-group">
                    <label className="form-label">
                        Tipo de Escrito <span className="required">*</span>
                    </label>
                    <div className="form-options">
                        {tiposEscrito.map(tipo => (
                            <label
                                key={tipo.value}
                                className={`form-option ${formData.tipo_escrito === tipo.value ? 'form-option--selected' : ''}`}
                            >
                                <input
                                    type="radio"
                                    name="tipo_escrito"
                                    value={tipo.value}
                                    checked={formData.tipo_escrito === tipo.value}
                                    onChange={handleChange}
                                />
                                <span>{tipo.label}</span>
                            </label>
                        ))}
                    </div>
                    {errors.tipo_escrito && <span className="form-error">{errors.tipo_escrito}</span>}
                </div>

                {/* Datos del imputado */}
                <div className="form-group">
                    <label className="form-label" htmlFor="nombre_imputado">
                        Nombre del Imputado/a <span className="required">*</span>
                    </label>
                    <input
                        id="nombre_imputado"
                        name="nombre_imputado"
                        type="text"
                        className={`form-input ${errors.nombre_imputado ? 'form-input--error' : ''}`}
                        value={formData.nombre_imputado}
                        onChange={handleChange}
                        placeholder="Apellido y nombre completo"
                    />
                    {errors.nombre_imputado && <span className="form-error">{errors.nombre_imputado}</span>}
                </div>

                <div className="form-group">
                    <label className="form-label" htmlFor="causa_numero">
                        N° de Causa / Expediente
                    </label>
                    <p className="form-hint">
                        Número completo de la IPP o expediente judicial (se incluye en el encabezado del escrito).
                    </p>
                    <input
                        id="causa_numero"
                        name="causa_numero"
                        type="text"
                        className="form-input"
                        value={formData.causa_numero}
                        onChange={handleChange}
                        placeholder="Ej: IPP 01-00-XXXXXX-XX / MP-1234/2025 / IUE 0.000-000000/2025"
                    />
                </div>

                {/* Hechos relevantes */}
                <div className="form-group">
                    <label className="form-label" htmlFor="hechos_relevantes">
                        Hechos Relevantes <span className="required">*</span>
                    </label>
                    <p className="form-hint">
                        Describa los hechos desde la perspectiva de la defensa: qué ocurrió, circunstancias de la
                        detención o imputación, pruebas disponibles, irregularidades procesales.
                    </p>
                    <textarea
                        id="hechos_relevantes"
                        name="hechos_relevantes"
                        className={`form-textarea ${errors.hechos_relevantes ? 'form-textarea--error' : ''}`}
                        rows="8"
                        value={formData.hechos_relevantes}
                        onChange={handleChange}
                        placeholder="Relate los hechos cronológicamente: fecha y circunstancias de la detención/imputación, estado de la causa, prueba disponible, irregularidades procesales detectadas, contexto y arraigo del imputado..."
                    />
                    <div className="form-textarea-footer">
                        <span className={`char-count ${charCount < 200 ? 'char-count--warning' : 'char-count--ok'}`}>
                            {charCount}/200 mínimo
                        </span>
                    </div>
                    {errors.hechos_relevantes && <span className="form-error">{errors.hechos_relevantes}</span>}
                </div>

                {/* Pretensión defensiva */}
                <div className="form-group">
                    <label className="form-label" htmlFor="pretension_defensiva">
                        Pretensión Defensiva <span className="required">*</span>
                    </label>
                    <p className="form-hint">
                        ¿Qué solicita concretamente al tribunal o juez de garantías?
                    </p>
                    <textarea
                        id="pretension_defensiva"
                        name="pretension_defensiva"
                        className={`form-textarea ${errors.pretension_defensiva ? 'form-textarea--error' : ''}`}
                        rows="3"
                        value={formData.pretension_defensiva}
                        onChange={handleChange}
                        placeholder="Ej: Se otorgue excarcelación bajo caución real de $[monto] (art. 189 CPP PBA) / Se declare la nulidad del allanamiento (arts. 219 y 211 CPP PBA) / Se revoque la prisión preventiva / Se dicte sobreseimiento por art. 323 inc. 3 CPP PBA..."
                    />
                    {errors.pretension_defensiva && <span className="form-error">{errors.pretension_defensiva}</span>}
                </div>

                {/* Fundamentos jurídicos adicionales */}
                <div className="form-group">
                    <label className="form-label" htmlFor="fundamentos_extra">
                        Fundamentos Jurídicos Adicionales
                    </label>
                    <p className="form-hint">
                        Artículos del CPP PBA, CP, CADH o jurisprudencia que desee incluir específicamente.
                    </p>
                    <textarea
                        id="fundamentos_extra"
                        name="fundamentos_extra"
                        className="form-textarea"
                        rows="3"
                        value={formData.fundamentos_extra}
                        onChange={handleChange}
                        placeholder="Ej: Art. 169 CPP PBA, art. 157 CPP PBA, art. 7 CADH. SCBA P. 12345/2023 (excarcelación por arraigo). CSJN Fallos 339:345..."
                    />
                </div>

                {/* Opciones */}
                <div className="form-group">
                    <label className="form-label">Opciones</label>
                    <div className="redactar__opciones">
                        <label className={`form-checkbox ${formData.incluir_citas_scba ? 'form-checkbox--checked' : ''}`}>
                            <input
                                type="checkbox"
                                name="incluir_citas_scba"
                                checked={formData.incluir_citas_scba}
                                onChange={handleChange}
                            />
                            <span className="form-checkbox__box">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </span>
                            <span>Incluir jurisprudencia del SCBA y CSJN</span>
                        </label>
                    </div>
                </div>

                {errors.api && (
                    <div className="form-error form-error--api">{errors.api}</div>
                )}

                <div className="form-actions">
                    <button type="button" className="btn btn--secondary" onClick={() => navigate('/')}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn--primary" disabled={isLoading}>
                        {isLoading ? 'Redactando escrito...' : 'Generar Borrador'}
                    </button>
                </div>
            </form>

            <footer className="analizar__footer">
                <p>
                    <strong>Importante:</strong> El borrador se genera con estructura de escrito judicial PBA.
                    Descárguelo en Word (.docx) para editar, completar los datos del expediente y firmar antes de presentar.
                </p>
            </footer>
        </div>
    )
}

export default Redactar
