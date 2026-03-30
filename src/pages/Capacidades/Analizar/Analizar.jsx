import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import exifr from 'exifr'
import { api } from '../../../services/api'
import { supabase } from '../../../services/supabase'
import { useAuth } from '../../../context/AuthContext'
import PipelineStatus from '../../../components/PipelineStatus/PipelineStatus'
import './Analizar.css'

const MAX_IMAGES = 4
const MAX_SIZE_MB = 4
const MAX_PDF = 2
const MAX_PDF_SIZE_MB = 10
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const FASES_PIPELINE_BASE = [
    { id: 'admisibilidad', nombre: 'Admisibilidad', subtitulo: 'Verifica que la consulta sea penal PBA con hechos suficientes' },
    { id: 'rag', nombre: 'RAG Penal', subtitulo: 'Recupera criterios jurídicos verificados del corpus' },
    { id: 'razonamiento', nombre: 'Razonamiento LIS', subtitulo: 'Razona desde la perspectiva defensiva' },
    { id: 'validacion', nombre: 'Validación de calidad', subtitulo: 'Controla sesgo acusatorio y certeza excesiva' },
    { id: 'informe', nombre: 'Informe + PDF', subtitulo: 'Genera el informe numerado con disclaimer institucional' },
]

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
    const timeoutRefs = useRef([])

    const [formData, setFormData] = useState({
        hechos: '',
        tipo_penal: '',
        etapa_procesal: '',
        prueba_acusacion: '',
        pretension_defensiva: '',
        documentacion_caso: '',
    })
    const [imagenes, setImagenes] = useState([])
    const [documentosPdf, setDocumentosPdf] = useState([])
    const [isDragging, setIsDragging] = useState(false)
    const [isPdfDragging, setIsPdfDragging] = useState(false)
    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)
    const [pipelineFases, setPipelineFases] = useState(
        FASES_PIPELINE_BASE.map(f => ({ ...f, estado: 'pendiente' }))
    )

    useEffect(() => {
        return () => {
            imagenes.forEach(img => URL.revokeObjectURL(img.preview))
            timeoutRefs.current.forEach(clearTimeout)
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
            newErrors.hechos = 'Necesito al menos una descripción de los hechos para iniciar el análisis.'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const processFile = async (file) => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
            setErrors(prev => ({ ...prev, imagenes: `Formato no soportado: ${file.name}. Use JPG, PNG o WebP.` }))
            return
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            setErrors(prev => ({ ...prev, imagenes: `${file.name} supera el límite de ${MAX_SIZE_MB}MB.` }))
            return
        }

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

    const handlePdfDragOver = (e) => {
        e.preventDefault()
        if (!isLoading && documentosPdf.length < MAX_PDF) setIsPdfDragging(true)
    }

    const handlePdfDragLeave = () => setIsPdfDragging(false)

    const handlePdfDrop = (e) => {
        e.preventDefault()
        setIsPdfDragging(false)
        if (isLoading || documentosPdf.length >= MAX_PDF) return
        const files = Array.from(e.dataTransfer.files)
        const remaining = MAX_PDF - documentosPdf.length
        files.slice(0, remaining).forEach(processPdf)
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

        // Limpiar timeouts previos
        timeoutRefs.current.forEach(clearTimeout)
        timeoutRefs.current = []

        setIsLoading(true)
        setErrors({})

        // Iniciar animación del pipeline: Fase 1 arranca inmediatamente
        setPipelineFases(FASES_PIPELINE_BASE.map((f, i) => ({
            ...f, estado: i === 0 ? 'ejecutando' : 'pendiente'
        })))

        // Fase 1 completa en t=0.8s → Fase 2 arranca
        const t1 = setTimeout(() => {
            setPipelineFases(prev => prev.map((f, i) =>
                i === 0 ? { ...f, estado: 'completada' } :
                i === 1 ? { ...f, estado: 'ejecutando' } : f
            ))
        }, 800)
        timeoutRefs.current.push(t1)

        // Fase 2 completa en t=2.5s → Fase 3 arranca
        const t2 = setTimeout(() => {
            setPipelineFases(prev => prev.map((f, i) =>
                i === 1 ? { ...f, estado: 'completada' } :
                i === 2 ? { ...f, estado: 'ejecutando' } : f
            ))
        }, 2500)
        timeoutRefs.current.push(t2)

        try {
            const payload = {
                ...formData,
                imagenes: imagenes.map(({ data, mediaType, nombre, metadatos }) => ({
                    data, mediaType, nombre,
                    metadatos_texto: metadatos?.texto
                })),
                documentos_pdf: documentosPdf.length > 0 ? documentosPdf : undefined,
            }

            const startTime = Date.now()
            const response = await api.analizarCaso(payload)

            if (!response) {
                timeoutRefs.current.forEach(clearTimeout)
                timeoutRefs.current = []
                setPipelineFases(FASES_PIPELINE_BASE.map(f => ({ ...f, estado: 'pendiente' })))
                setErrors({ api: 'El servidor no respondió. Intente nuevamente.' })
                setIsLoading(false)
                return
            }

            // Iniciar guardado del historial en paralelo con la espera de animación
            const historialPromise = (async () => {
                if (!response.success) return null
                if (supabase && user) {
                    try {
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
                            console.error('[Historial] Error al guardar:', insertError)
                            return `[${insertError.code}] ${insertError.message}`
                        }
                        supabase.rpc('increment_analisis_count').then(() => {}, () => {})
                        return null
                    } catch (saveErr) {
                        return saveErr?.message || 'Error desconocido'
                    }
                } else {
                    const msg = `supabase=${!!supabase} user=${!!user}`
                    console.warn('[Historial] No se guarda:', msg)
                    return msg
                }
            })()

            // Esperar hasta que Fase 3 esté corriendo (mínimo 3.2s desde el inicio)
            const elapsed = Date.now() - startTime
            if (elapsed < 3200) {
                await new Promise(resolve => {
                    const t = setTimeout(resolve, 3200 - elapsed)
                    timeoutRefs.current.push(t)
                })
            }

            const _historialError = await historialPromise

            if (response.success) {
                const estadoLabels = {
                    approved: 'INFORME APROBADO',
                    limited: 'INFORME CON LIMITACIONES',
                    rejected: 'NO ENTREGABLE',
                }
                const navigateState = {
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

                // Fase 3 completa → Fase 4 arranca
                setPipelineFases(prev => prev.map((f, i) =>
                    i === 2 ? { ...f, estado: 'completada' } :
                    i === 3 ? { ...f, estado: 'ejecutando' } : f
                ))

                // Fase 4 completa en +0.6s → Fase 5 arranca
                const t3 = setTimeout(() => {
                    setPipelineFases(prev => prev.map((f, i) =>
                        i === 3 ? { ...f, estado: 'completada' } :
                        i === 4 ? { ...f, estado: 'ejecutando' } : f
                    ))
                }, 600)
                timeoutRefs.current.push(t3)

                // Fase 5 completa en +1.1s
                const t4 = setTimeout(() => {
                    setPipelineFases(prev => prev.map((f, i) =>
                        i === 4 ? { ...f, estado: 'completada' } : f
                    ))
                }, 1100)
                timeoutRefs.current.push(t4)

                // Navegar en +1.4s
                const t5 = setTimeout(() => {
                    navigate('/resultado', { state: navigateState })
                }, 1400)
                timeoutRefs.current.push(t5)

            } else {
                // Consulta rechazada por admisibilidad u otro criterio
                timeoutRefs.current.forEach(clearTimeout)
                timeoutRefs.current = []
                setPipelineFases(FASES_PIPELINE_BASE.map((f, i) => ({
                    ...f,
                    estado: i === 0 ? 'rechazada' : 'pendiente'
                })))
                setErrors({
                    api: response.fundamento || response.recomendacion || response.mensaje || 'La consulta no pudo ser procesada.'
                })
                setIsLoading(false)
            }
        } catch (err) {
            console.error('[Analizar] Error inesperado:', err)
            timeoutRefs.current.forEach(clearTimeout)
            timeoutRefs.current = []
            setPipelineFases(FASES_PIPELINE_BASE.map(f => ({ ...f, estado: 'pendiente' })))
            setErrors({ api: `Error: ${err?.message || 'Intente nuevamente.'}` })
            setIsLoading(false)
        }
    }

    const charCount = formData.hechos.length
    const imagenesRestantes = MAX_IMAGES - imagenes.length

    return (
        <div className="analizar-layout">

            {/* ── Header ── */}
            <header className="analizar-layout__header">
                <button className="analizar__back" onClick={() => navigate('/')} disabled={isLoading}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Volver
                </button>
                <div>
                    <h1 className="analizar-layout__titulo">Nueva Consulta Penal</h1>
                    <p className="analizar-layout__subtitulo">
                        Análisis defensivo · CPP PBA · In dubio pro reo
                    </p>
                </div>
            </header>

            {/* ── Body: 2 columnas ── */}
            <div className="analizar-layout__body">

                {/* ── PANEL IZQUIERDO — Formulario ── */}
                <div className="analizar-layout__izq">
                    <form className="analizar__form" onSubmit={handleSubmit}>

                        {/* Hechos — campo principal */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="hechos">
                                Describí los hechos del caso <span className="required">*</span>
                            </label>
                            <p className="form-hint">
                                Narrá los hechos tal como figuran en la causa: fechas, lugares y circunstancias relevantes.
                                Incluí qué dijo la acusación y cualquier aspecto que consideres clave para la defensa.
                            </p>
                            <textarea
                                id="hechos"
                                name="hechos"
                                className={`form-textarea ${errors.hechos ? 'form-textarea--error' : ''}`}
                                rows="7"
                                value={formData.hechos}
                                onChange={handleChange}
                                placeholder="Ej: Se imputa al defendido haber... en fecha aproximada... en perjuicio de... La acusación encuadra la conducta en el art. ... del Código Penal."
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
                                Delito imputado <span className="form-label__opt">(opcional)</span>
                            </label>
                            <input
                                type="text"
                                id="tipo_penal"
                                name="tipo_penal"
                                className="form-input"
                                value={formData.tipo_penal}
                                onChange={handleChange}
                                placeholder="Ej: robo calificado art. 166 CP, abuso sexual art. 119 CP..."
                                disabled={isLoading}
                            />
                        </div>

                        {/* Etapa Procesal */}
                        <div className="form-group">
                            <label className="form-label">
                                Etapa del proceso <span className="form-label__opt">(opcional)</span>
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
                                Prueba invocada por la acusación <span className="form-label__opt">(opcional)</span>
                            </label>
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
                                Pretensión defensiva <span className="form-label__opt">(opcional)</span>
                            </label>
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

                        {/* Expediente del MEV — PDF Dropzone */}
                        <div className="form-group">
                            <label className="form-label">
                                Expediente del MEV
                                <span className="form-label__badge">PDF</span>
                                <span className="form-label__opt">(opcional)</span>
                            </label>
                            <p className="form-hint">
                                Subí las piezas más relevantes del expediente desde el MEV: acta de detención,
                                auto de procesamiento, pericia médico-forense, acta de allanamiento.
                                Hasta {MAX_PDF} PDF · Máx. {MAX_PDF_SIZE_MB}MB c/u.
                            </p>

                            <input
                                type="file"
                                ref={pdfInputRef}
                                accept="application/pdf"
                                multiple
                                onChange={handlePdfSelect}
                                style={{ display: 'none' }}
                                disabled={isLoading}
                            />

                            <div
                                className={`pdf-dropzone${isPdfDragging ? ' pdf-dropzone--dragging' : ''}${documentosPdf.length >= MAX_PDF ? ' pdf-dropzone--full' : ''}`}
                                onDragOver={handlePdfDragOver}
                                onDragLeave={handlePdfDragLeave}
                                onDrop={handlePdfDrop}
                                onClick={() => !isLoading && documentosPdf.length < MAX_PDF && pdfInputRef.current?.click()}
                            >
                                <svg className="pdf-dropzone__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                    <line x1="12" y1="18" x2="12" y2="12"/>
                                    <line x1="9" y1="15" x2="15" y2="15"/>
                                </svg>
                                {documentosPdf.length >= MAX_PDF ? (
                                    <span className="pdf-dropzone__text">Límite alcanzado ({MAX_PDF}/{MAX_PDF} PDFs)</span>
                                ) : (
                                    <>
                                        <span className="pdf-dropzone__text">
                                            {isPdfDragging ? 'Soltá el PDF aquí' : 'Arrastrá PDFs del MEV o hacé clic para seleccionar'}
                                        </span>
                                        <span className="pdf-dropzone__sub">
                                            {documentosPdf.length > 0 ? `${documentosPdf.length}/${MAX_PDF} PDFs cargados` : `Hasta ${MAX_PDF} PDF · Máx. ${MAX_PDF_SIZE_MB}MB`}
                                        </span>
                                    </>
                                )}
                            </div>

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

                        {/* Documentación del Expediente — texto */}
                        <div className="form-group">
                            <label className="form-label" htmlFor="documentacion_caso">
                                Texto del expediente <span className="form-label__opt">(opcional)</span>
                            </label>
                            <p className="form-hint">
                                Pegá aquí el texto de pericias, declaraciones, actas u otros documentos
                                copiados directamente del MEV u otra fuente.
                            </p>
                            <textarea
                                id="documentacion_caso"
                                name="documentacion_caso"
                                className="form-textarea"
                                rows="5"
                                value={formData.documentacion_caso}
                                onChange={handleChange}
                                placeholder="Ej: Pericia médico-forense: '...el examen físico revela...', Declaración testimonial: '...'"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Imágenes Adjuntas */}
                        <div className="form-group">
                            <label className="form-label">
                                Imágenes adjuntas <span className="form-label__opt">(opcional)</span>
                            </label>
                            <p className="form-hint">
                                Hasta {MAX_IMAGES} imágenes: pericias escaneadas, capturas de WhatsApp,
                                fotos de evidencia. JPG, PNG, WebP · Máx. {MAX_SIZE_MB}MB c/u.
                            </p>
                            <p className="form-hint form-hint--aviso">
                                Solo imágenes relacionadas con el expediente. El sistema analiza metadatos EXIF
                                para detectar vicios en la cadena de custodia digital.
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
                                        {isDragging ? 'Soltá las imágenes aquí' : 'Hacé clic o arrastrá imágenes aquí'}
                                    </p>
                                    <p className="upload-zone__counter">
                                        {imagenes.length}/{MAX_IMAGES} · {imagenesRestantes} lugar{imagenesRestantes !== 1 ? 'es' : ''} disponible{imagenesRestantes !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            )}

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
                                    Límite alcanzado ({MAX_IMAGES}/{MAX_IMAGES}). Eliminá una imagen para agregar otra.
                                </p>
                            )}

                            {errors.imagenes && <span className="form-error">{errors.imagenes}</span>}
                        </div>

                        {/* Error de API */}
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

                        {/* Botón submit */}
                        <div className="form-actions">
                            <button
                                type="submit"
                                className="analizar__btn-submit"
                                disabled={isLoading}
                            >
                                {isLoading
                                    ? <><span className="analizar__btn-spinner" />Analizando...</>
                                    : 'Iniciar análisis penal'
                                }
                            </button>
                            <p className="analizar__btn-ayuda">
                                El análisis puede rechazarse si los hechos no corresponden al fuero penal PBA
                                o si la base jurídica disponible es insuficiente.
                            </p>
                        </div>
                    </form>
                </div>

                {/* ── PANEL DERECHO — Info del sistema o Pipeline ── */}
                <aside className="analizar-layout__der">
                    {isLoading ? (
                        <div className="analizar-panel analizar-panel--cargando">
                            <p className="analizar-panel__cargando-label">
                                <span className="analizar-panel__cargando-dot" />
                                Analizando tu caso...
                            </p>
                            <PipelineStatus phases={pipelineFases} mostrarDetalle={false} />
                            <p className="analizar-panel__cargando-nota">
                                El análisis puede tardar entre 10 y 30 segundos.<br />
                                No cierres esta ventana.
                            </p>
                        </div>
                    ) : (
                        <div className="analizar-panel analizar-panel--idle">
                            <h2 className="analizar-panel__titulo">
                                ¿Qué hace el sistema con tu consulta?
                            </h2>
                            <PipelineStatus phases={pipelineFases} mostrarDetalle={false} />
                            <div className="analizar-panel__footer">
                                <p className="analizar-panel__timing">
                                    El análisis puede tardar entre 10 y 30 segundos.
                                </p>
                                <p className="analizar-panel__advertencia">
                                    El sistema prefiere rechazar con fundamento antes que improvisar.
                                </p>
                            </div>

                            {/* Capacidades de análisis documental */}
                            <div className="analizar-capacidades">
                                <div className="analizar-capacidades__titulo">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                                        <path d="M11 8v6"/><path d="M8 11h6"/>
                                    </svg>
                                    Análisis documental incluido
                                </div>
                                <ul className="analizar-capacidades__lista">
                                    <li>
                                        <span>📄</span>
                                        <div>
                                            <strong>PDFs del expediente</strong>
                                            <span>Lee pericias, declaraciones y actas. Contrasta conclusiones contra hallazgos objetivos.</span>
                                        </div>
                                    </li>
                                    <li>
                                        <span>🔍</span>
                                        <div>
                                            <strong>Pericias médico-forenses</strong>
                                            <span>Detecta si las conclusiones exceden los hallazgos o si falta metodología validada (SVA/CBCA/NICHD).</span>
                                        </div>
                                    </li>
                                    <li>
                                        <span>📱</span>
                                        <div>
                                            <strong>Capturas digitales</strong>
                                            <span>Identifica ausencia de pericia informática y vicios en la cadena de custodia digital.</span>
                                        </div>
                                    </li>
                                    <li>
                                        <span>🖼️</span>
                                        <div>
                                            <strong>Fotos de evidencia</strong>
                                            <span>Analiza si la imagen respalda lo que la acusación afirma o si contradice su versión.</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    )
}

export default Analizar
