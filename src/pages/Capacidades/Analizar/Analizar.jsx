import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import exifr from 'exifr'
import { api } from '../../../services/api'
import { supabase } from '../../../services/supabase'
import { useAuth } from '../../../context/AuthContext'
import './Analizar.css'

const MAX_IMAGES = 4
const MAX_SIZE_MB = 4
const MAX_PDF = 2
const MAX_PDF_SIZE_MB = 10
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Construye un resumen de metadatos EXIF para mostrar en la UI y enviar a la Edge Function.
 * El resumen tiene valor defensivo: ausencia de EXIF = posible captura / edición = vicio procesal.
 */
function buildMetadataSummary(exif, filename) {
    const sinExif = !exif || Object.keys(exif).length === 0

    if (sinExif) {
        return {
            tipo: 'sin_exif',
            etiqueta: 'Sin metadatos EXIF',
            texto:
                `Imagen: ${filename}\n` +
                `- Dispositivo: No disponible\n` +
                `- Fecha de captura: No disponible\n` +
                `- GPS: No disponible\n` +
                `- Software: No disponible\n` +
                `ALERTA DEFENSIVA: La ausencia total de metadatos EXIF indica que esta imagen puede ser ` +
                `(a) captura de pantalla sin certificación, ` +
                `(b) imagen editada que perdió metadatos, o ` +
                `(c) imagen de origen incierto. ` +
                `Requiere pericia informática para acreditar integridad y autoría (art. 244 CPP PBA). ` +
                `La ausencia de metadatos es un vicio en la cadena de custodia digital que la defensa debe señalar.`
        }
    }

    const dispositivo = [exif.Make, exif.Model].filter(Boolean).join(' ') || null
    const fechaRaw = exif.DateTimeOriginal
    const fecha = fechaRaw
        ? (fechaRaw instanceof Date ? fechaRaw : new Date(fechaRaw)).toLocaleString('es-AR')
        : null
    const software = exif.Software || null
    const tieneGps = exif.GPSLatitude != null
    const softwareLower = (software || '').toLowerCase()

    const esEditada =
        softwareLower.includes('photoshop') ||
        softwareLower.includes('gimp') ||
        softwareLower.includes('lightroom') ||
        softwareLower.includes('snapseed') ||
        softwareLower.includes('picsart')

    const posibleCaptura =
        !dispositivo && !fecha &&
        (softwareLower.includes('ios') || softwareLower.includes('android') || softwareLower.includes('windows'))

    let tipo, etiqueta
    if (esEditada) {
        tipo = 'editada'
        etiqueta = `Editada (${software.split(' ')[0]})`
    } else if (posibleCaptura) {
        tipo = 'captura'
        etiqueta = 'Posible captura'
    } else if (dispositivo) {
        tipo = 'ok'
        etiqueta = dispositivo.length > 20 ? dispositivo.slice(0, 18) + '…' : dispositivo
    } else {
        tipo = 'sin_exif'
        etiqueta = 'EXIF incompleto'
    }

    let alertaTexto = ''
    if (esEditada) {
        alertaTexto =
            `\nALERTA DEFENSIVA: La imagen fue procesada con software de edición (${software}). ` +
            `Esto compromete su autenticidad como prueba digital. ` +
            `La defensa debe señalar este vicio en la cadena de custodia.`
    } else if (posibleCaptura) {
        alertaTexto =
            `\nNOTA: Los metadatos sugieren captura de pantalla (software: ${software}, sin dispositivo de cámara). ` +
            `Requiere pericia informática para acreditar integridad y autoría (art. 244 CPP PBA).`
    }

    return {
        tipo,
        etiqueta,
        texto:
            `Imagen: ${filename}\n` +
            `- Dispositivo: ${dispositivo || 'No disponible'}\n` +
            `- Fecha de captura: ${fecha || 'No disponible'}\n` +
            `- GPS: ${tieneGps ? 'Presente (coordenadas registradas)' : 'No disponible'}\n` +
            `- Software: ${software || 'No disponible'}` +
            alertaTexto
    }
}

const etapasProcesales = [
    { value: 'ipp', label: 'Investigación Penal Preparatoria (IPP)' },
    { value: 'juicio_oral', label: 'Juicio Oral' },
    { value: 'recursos', label: 'Recursos / Casación' },
    { value: 'ejecucion', label: 'Ejecución de Sentencia' },
]

function Analizar() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const fileInputRef = useRef(null)
    const pdfInputRef = useRef(null)

    const [formData, setFormData] = useState({
        hechos: '',
        tipo_penal: '',
        etapa_procesal: '',
        prueba_acusacion: '',
        pretension_defensiva: '',
        documentacion_caso: '',
    })
    const [imagenes, setImagenes] = useState([])    // [{data, mediaType, nombre, preview}]
    const [documentosPdf, setDocumentosPdf] = useState([]) // [{data, nombre}]
    const [isDragging, setIsDragging] = useState(false)
    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)

    // Revocar blob URLs al desmontar el componente
    useEffect(() => {
        return () => {
            imagenes.forEach(img => URL.revokeObjectURL(img.preview))
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

    // Procesa imágenes (JPG, PNG, WebP) — extrae EXIF para análisis defensivo
    const processFile = async (file) => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
            setErrors(prev => ({ ...prev, imagenes: `Formato no soportado: ${file.name}. Use JPG, PNG o WebP.` }))
            return
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            setErrors(prev => ({ ...prev, imagenes: `${file.name} supera el límite de ${MAX_SIZE_MB}MB.` }))
            return
        }

        // Extraer metadatos EXIF antes de leer el binario
        let exifData = null
        try {
            exifData = await exifr.parse(file, {
                pick: ['Make', 'Model', 'DateTimeOriginal', 'Software', 'GPSLatitude', 'GPSLongitude', 'Artist']
            })
        } catch { /* archivo sin EXIF es válido */ }

        const metadatos = buildMetadataSummary(exifData, file.name)

        const base64 = await new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target.result.split(',')[1])
            reader.readAsDataURL(file)
        })

        const preview = URL.createObjectURL(file)
        setImagenes(prev => [...prev, { data: base64, mediaType: file.type, nombre: file.name, preview, metadatos }])
        setErrors(prev => ({ ...prev, imagenes: null }))
    }

    // Procesa PDFs para documentación
    const processPdf = (file) => {
        if (file.type !== 'application/pdf') {
            setErrors(prev => ({ ...prev, pdfs: `${file.name} no es un PDF válido.` }))
            return
        }
        if (file.size > MAX_PDF_SIZE_MB * 1024 * 1024) {
            setErrors(prev => ({ ...prev, pdfs: `${file.name} supera el límite de ${MAX_PDF_SIZE_MB}MB.` }))
            return
        }
        const reader = new FileReader()
        reader.onload = (e) => {
            const base64 = e.target.result.split(',')[1]
            setDocumentosPdf(prev => [...prev, { data: base64, nombre: file.name }])
            setErrors(prev => ({ ...prev, pdfs: null }))
        }
        reader.readAsDataURL(file)
    }

    const handleFileSelect = async (e) => {
        const target = e.target
        const files = Array.from(target.files)
        const remaining = MAX_IMAGES - imagenes.length
        for (const file of files.slice(0, remaining)) {
            await processFile(file)
        }
        target.value = ''
    }

    const handlePdfSelect = (e) => {
        const files = Array.from(e.target.files)
        const remaining = MAX_PDF - documentosPdf.length
        files.slice(0, remaining).forEach(processPdf)
        e.target.value = ''
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        if (!isLoading && imagenes.length < MAX_IMAGES) setIsDragging(true)
    }

    const handleDragLeave = () => setIsDragging(false)

    const handleDrop = async (e) => {
        e.preventDefault()
        setIsDragging(false)
        if (isLoading || imagenes.length >= MAX_IMAGES) return
        const files = Array.from(e.dataTransfer.files)
        const remaining = MAX_IMAGES - imagenes.length
        for (const file of files.slice(0, remaining)) {
            await processFile(file)
        }
    }

    const handleRemoveImage = (index) => {
        setImagenes(prev => {
            URL.revokeObjectURL(prev[index].preview)
            return prev.filter((_, i) => i !== index)
        })
    }

    const handleRemovePdf = (index) => {
        setDocumentosPdf(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validate()) return

        setIsLoading(true)
        setErrors({})

        try {
            const payload = {
                ...formData,
                imagenes: imagenes.map(({ data, mediaType, nombre, metadatos }) => ({
                    data, mediaType, nombre,
                    metadatos_texto: metadatos?.texto
                })),
                documentos_pdf: documentosPdf.length > 0 ? documentosPdf : undefined,
            }

            const response = await api.analizarCaso(payload)

            if (!response) {
                setErrors({ api: 'El servidor no respondió. Intente nuevamente.' })
                return
            }

            if (response.success) {
                // Guardar en historial
                let _historialError = null
                try {
                    if (supabase && user) {
                        const { error: insertError } = await supabase.from('analisis').insert({
                            user_id: user.id,
                            numero_informe: response.data?.numero_informe,
                            fecha_emision: response.data?.fecha_emision || new Date().toISOString(),
                            status: response.status,
                            tipo_analisis: 'analizar',
                            hechos: formData.hechos,
                            tipo_penal: formData.tipo_penal || null,
                            etapa_procesal: formData.etapa_procesal || null,
                            resultado_json: response.data,
                            criterios_utilizados: response.meta?.criterios_utilizados ?? null,
                            pipeline_version: response.meta?.pipeline_version ?? null,
                        })
                        if (insertError) {
                            _historialError = `[${insertError.code}] ${insertError.message}`
                            console.error('[Historial] Error al guardar:', insertError)
                        }
                        supabase.rpc('increment_analisis_count').catch(() => {})
                    } else {
                        _historialError = `supabase=${!!supabase} user=${!!user}`
                        console.warn('[Historial] No se guarda:', _historialError)
                    }
                } catch (saveErr) {
                    _historialError = saveErr?.message || 'Error desconocido'
                }

                const estadoLabels = {
                    approved: 'INFORME APROBADO',
                    limited: 'INFORME CON LIMITACIONES',
                    rejected: 'NO ENTREGABLE',
                }
                navigate('/resultado', {
                    state: {
                        capacidad: 'analizar',
                        _historialError,
                        data: {
                            ...(response.data || {}),
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
                setErrors({
                    api: response.fundamento || response.recomendacion || response.mensaje || 'La consulta no pudo ser procesada.'
                })
            }
        } catch (err) {
            console.error('[Analizar] Error inesperado:', err)
            setErrors({ api: `Error: ${err?.message || 'Intente nuevamente.'}` })
        } finally {
            setIsLoading(false)
        }
    }

    const charCount = formData.hechos.length
    const imagenesRestantes = MAX_IMAGES - imagenes.length

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

            {/* Bloque de capacidades de análisis */}
            <div className="analizar__capacidades">
                <div className="capacidades__titulo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                        <path d="M11 8v6"/><path d="M8 11h6"/>
                    </svg>
                    Inteligencia de Análisis Documental
                </div>
                <p className="capacidades__desc">
                    El sistema utiliza IA con visión para analizar directamente los documentos del expediente,
                    no solo el texto que usted describe. Adjunte la documentación real y el sistema detectará
                    lo que muchos revisores humanos pasan por alto.
                </p>
                <ul className="capacidades__lista">
                    <li>
                        <span className="capacidades__icono">📄</span>
                        <div>
                            <strong>PDFs del expediente</strong>
                            <span>Lee pericias, declaraciones y actas completas. Contrasta conclusiones contra hallazgos objetivos.</span>
                        </div>
                    </li>
                    <li>
                        <span className="capacidades__icono">🔍</span>
                        <div>
                            <strong>Pericias médico-forenses y psicológicas</strong>
                            <span>Detecta si las conclusiones exceden los hallazgos, si falta metodología validada (SVA/CBCA/NICHD) o si la pericia invade la función del juez.</span>
                        </div>
                    </li>
                    <li>
                        <span className="capacidades__icono">📱</span>
                        <div>
                            <strong>Capturas de WhatsApp, email y redes sociales</strong>
                            <span>Identifica la ausencia de pericia informática, riesgos de edición o descontextualización, y vicios en la cadena de custodia digital.</span>
                        </div>
                    </li>
                    <li>
                        <span className="capacidades__icono">🖼️</span>
                        <div>
                            <strong>Fotos de evidencia física</strong>
                            <span>Analiza si la imagen respalda lo que la acusación afirma o si contradice su versión.</span>
                        </div>
                    </li>
                </ul>
            </div>

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

                {/* Documentación del Expediente */}
                <div className="form-group">
                    <label className="form-label" htmlFor="documentacion_caso">
                        Documentación del Expediente
                    </label>
                    <p className="form-hint">
                        Pegue aquí el texto de pericias, declaraciones, actas u otros documentos del expediente,
                        o adjunte hasta {MAX_PDF} PDF (máx. {MAX_PDF_SIZE_MB}MB c/u). Puede usar ambas opciones a la vez.
                    </p>
                    <textarea
                        id="documentacion_caso"
                        name="documentacion_caso"
                        className="form-textarea"
                        rows="6"
                        value={formData.documentacion_caso}
                        onChange={handleChange}
                        placeholder="Ej: Pericia médico-forense: '...el examen físico revela...', Declaración testimonial: '...la denunciante manifestó...', Acta de allanamiento: '...'"
                        disabled={isLoading}
                    />

                    {/* Carga de PDFs */}
                    <input
                        type="file"
                        ref={pdfInputRef}
                        accept="application/pdf"
                        multiple
                        onChange={handlePdfSelect}
                        style={{ display: 'none' }}
                        disabled={isLoading}
                    />
                    {documentosPdf.length < MAX_PDF && (
                        <button
                            type="button"
                            className="btn-pdf-upload"
                            onClick={() => !isLoading && pdfInputRef.current?.click()}
                            disabled={isLoading}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="12" y1="18" x2="12" y2="12"/>
                                <line x1="9" y1="15" x2="15" y2="15"/>
                            </svg>
                            Adjuntar PDF del expediente
                        </button>
                    )}
                    {documentosPdf.length > 0 && (
                        <div className="pdf-list">
                            {documentosPdf.map((pdf, i) => (
                                <div key={i} className="pdf-item">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                        <polyline points="14 2 14 8 20 8"/>
                                    </svg>
                                    <span className="pdf-item__nombre">{pdf.nombre.length > 30 ? pdf.nombre.slice(0, 28) + '…' : pdf.nombre}</span>
                                    {!isLoading && (
                                        <button type="button" className="pdf-item__remove" onClick={() => handleRemovePdf(i)}>×</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {errors.pdfs && <span className="form-error">{errors.pdfs}</span>}
                </div>

                {/* Imágenes Adjuntas */}
                <div className="form-group">
                    <label className="form-label">Imágenes Adjuntas</label>
                    <p className="form-hint">
                        Adjunte hasta {MAX_IMAGES} imágenes: pericias escaneadas, capturas de WhatsApp,
                        fotos de evidencia o escritos manuscritos. Formatos: JPG, PNG, WebP · Máx. {MAX_SIZE_MB}MB c/u.
                    </p>
                    <p className="form-hint form-hint--aviso">
                        Solo se admiten imágenes relacionadas con el expediente judicial. El sistema rechaza automáticamente
                        contenido inapropiado. Cada carga queda registrada bajo su cuenta.
                    </p>

                    {imagenes.length < MAX_IMAGES && (
                        <div
                            className={`upload-zone${isDragging ? ' upload-zone--dragging' : ''}${isLoading ? ' upload-zone--disabled' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => !isLoading && fileInputRef.current?.click()}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && !isLoading && fileInputRef.current?.click()}
                            aria-label="Subir imágenes"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                                disabled={isLoading}
                            />
                            <svg className="upload-zone__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                            </svg>
                            <p className="upload-zone__text">
                                {isDragging ? 'Suelte las imágenes aquí' : 'Haga clic o arrastre imágenes aquí'}
                            </p>
                            <p className="upload-zone__counter">
                                {imagenes.length}/{MAX_IMAGES} · {imagenesRestantes} lugar{imagenesRestantes !== 1 ? 'es' : ''} disponible{imagenesRestantes !== 1 ? 's' : ''}
                            </p>
                        </div>
                    )}

                    {/* Thumbnails de imágenes cargadas */}
                    {imagenes.length > 0 && (
                        <div className="imagenes-preview">
                            {imagenes.map((img, index) => (
                                <div key={index} className="imagen-thumb">
                                    <img
                                        src={img.preview}
                                        alt={img.nombre}
                                        className="imagen-thumb__img"
                                    />
                                    {!isLoading && (
                                        <button
                                            type="button"
                                            className="imagen-thumb__remove"
                                            onClick={() => handleRemoveImage(index)}
                                            title="Eliminar imagen"
                                            aria-label={`Eliminar ${img.nombre}`}
                                        >
                                            ×
                                        </button>
                                    )}
                                    <p className="imagen-thumb__nombre">
                                        {img.nombre.length > 14 ? img.nombre.slice(0, 12) + '…' : img.nombre}
                                    </p>
                                    {img.metadatos && (
                                        <p
                                            className={`imagen-thumb__meta imagen-thumb__meta--${img.metadatos.tipo}`}
                                            title={img.metadatos.texto}
                                        >
                                            {img.metadatos.etiqueta}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {imagenes.length >= MAX_IMAGES && (
                        <p className="upload-limit-msg">
                            Límite alcanzado ({MAX_IMAGES}/{MAX_IMAGES}). Elimine una imagen para agregar otra.
                        </p>
                    )}

                    {errors.imagenes && <span className="form-error">{errors.imagenes}</span>}
                </div>

                {/* Error general de API */}
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
