import './Manual.css'

const secciones = [
    {
        id: 'primeros-pasos',
        icono: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
        ),
        titulo: 'Primeros Pasos',
        bloques: [
            {
                subtitulo: 'Flujo de trabajo recomendado',
                tipo: 'flujo',
                items: [
                    { icono: '🔍', label: 'Analizar', detalle: 'Al recibir un caso nuevo: evalúe viabilidad defensiva antes de comprometerse.' },
                    { icono: '📋', label: 'Auditar', detalle: 'Cuando ya tiene estrategia: detecte inconsistencias antes de ir a audiencia.' },
                    { icono: '✍️', label: 'Redactar', detalle: 'Para generar un borrador estructurado de su escrito defensivo.' },
                ]
            },
        ]
    },
    {
        id: 'analizar',
        icono: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6"/><path d="M8 11h6"/>
            </svg>
        ),
        titulo: 'Analizar Caso',
        badge: 'Función principal',
        bloques: [
            {
                subtitulo: '¿Qué hace?',
                tipo: 'texto',
                texto: 'Recibe los hechos imputados y produce un análisis defensivo estructurado: encuadre procesal, evaluación de la prueba de cargo, nulidades potenciales, contraargumentación y conclusión defensiva. Opera exclusivamente desde la perspectiva del imputado — in dubio pro reo.'
            },
            {
                subtitulo: 'Flujo principal — análisis directo desde el MEV',
                tipo: 'pasos',
                items: [
                    { num: '1', label: 'Activar el componente MEV', detalle: 'Instale la extensión de Chrome (una sola vez). En la pantalla Analizar, el panel "Conexión MEV" tiene el enlace de instalación.' },
                    { num: '2', label: 'Abrir su causa en el MEV', detalle: 'Ingrese a mev.scba.gov.ar con sus credenciales y navegue hasta la causa autorizada.' },
                    { num: '3', label: 'Hacer clic en "Analizar" en el panel lateral', detalle: 'La extensión extrae la carátula y las actuaciones del expediente — sin copiar ni tipear nada. El resultado aparece automáticamente en esta web.' },
                ]
            },
            {
                subtitulo: 'Carga manual (si el expediente no está en el MEV)',
                tipo: 'lista',
                items: [
                    { label: 'Texto del expediente (obligatorio)', detalle: 'Pegue el texto del expediente o describa los hechos (mínimo 20 caracteres). El sistema extrae automáticamente los hechos, la etapa procesal, el delito imputado y la prueba de cargo — no necesita separarlos usted.' },
                    { label: '¿Qué aspectos quiere analizar? (opcional)', detalle: 'Ej: "¿Puedo pedir la excarcelación?", "¿Hay nulidades en el allanamiento?". Si no especifica, el análisis defensivo es integral.' },
                    { label: 'PDFs del expediente (opcional)', detalle: 'Adjunte hasta 2 archivos PDF (máx. 10 MB c/u): pericias completas, actas, declaraciones escaneadas. El sistema los lee íntegramente. Adjuntar documentos solo es posible por esta vía.' },
                    { label: 'Imágenes del expediente (opcional)', detalle: 'Adjunte hasta 4 imágenes JPG/PNG/WebP (máx. 4 MB c/u): capturas de pantalla, fotos de evidencia, escritos manuscritos. El sistema las analiza visualmente.' },
                ]
            },
            {
                subtitulo: 'Flujo de 2 pasos',
                tipo: 'pasos',
                items: [
                    { num: '1', label: 'Análisis Preliminar', detalle: 'El sistema muestra el encuadre procesal, el análisis de prueba y las limitaciones. Verifique que el sistema entendió correctamente el caso antes de continuar.' },
                    { num: '2', label: 'Estrategia Defensiva', detalle: 'Una vez confirmado el encuadre, se despliegan las nulidades, contraargumentación, conclusión y patrones detectados. Este paso solo aparece después de su confirmación.' },
                ]
            },
            {
                subtitulo: 'Qué recibirá',
                tipo: 'lista',
                items: [
                    { label: 'Encuadre procesal', detalle: 'Lectura del caso desde el CPP PBA y código penal aplicable.' },
                    { label: 'Análisis de prueba de cargo', detalle: 'Fortalezas y debilidades de cada elemento probatorio presentado por la acusación.' },
                    { label: 'Nulidades y vicios', detalle: 'Defectos procesales detectables en la información proporcionada.' },
                    { label: 'Contraargumentación', detalle: 'Líneas de defensa concretas con fundamento normativo.' },
                    { label: 'Conclusión defensiva', detalle: 'Síntesis con pretensión recomendada y fundamento.' },
                    { label: 'Patrones procesales detectados', detalle: 'Alertas automáticas sobre patrones de alto riesgo: prueba digital sin pericia, cambio en la plataforma fáctica, uso problemático de Cámara Gesell, pericia psicológica de baja calidad, entre otros.' },
                ]
            },
            {
                subtitulo: 'Tips para mejores resultados',
                tipo: 'tips',
                items: [
                    'Cargue toda la prueba que tenga la acusación, no solo la que le parece relevante.',
                    'Adjunte los PDFs de pericias completas — el sistema los lee y contrasta conclusiones contra hallazgos.',
                    'Si tiene imágenes (capturas de WhatsApp, fotos de evidencia), adjúntelas — el sistema analiza metadatos EXIF y alerta sobre vicios en la cadena de custodia digital.',
                    'Para casos complejos, puede hacer varias consultas: una por aspecto (ej: nulidad del allanamiento por separado).',
                    'Si el resultado dice "No entregable", relea el mensaje de rechazo — generalmente es por falta de información mínima.',
                ]
            },
        ]
    },
    {
        id: 'auditar',
        icono: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
        ),
        titulo: 'Auditar Estrategia',
        bloques: [
            {
                subtitulo: '¿Qué hace?',
                tipo: 'texto',
                texto: 'Revisa la coherencia interna de una estrategia defensiva ya elaborada. Detecta supuestos implícitos, inconsistencias argumentales y puntos débiles que la acusación podría aprovechar. Es el "segundo par de ojos" antes de una audiencia o escrito crucial.'
            },
            {
                subtitulo: 'Dos formas de cargar los datos',
                tipo: 'texto',
                texto: 'Desde un informe de análisis (botón "Auditar Estrategia" al pie), la etapa, el delito y el contexto del expediente vienen precargados. También puede completar el formulario desde cero. En ambos casos, la estrategia y el objetivo defensivo los escribe usted: son su criterio profesional, el sistema no los deduce.'
            },
            {
                subtitulo: 'Cuándo usarlo',
                tipo: 'lista',
                items: [
                    { label: 'Antes de audiencias de juicio oral', detalle: 'Valide que su teoría del caso no tenga fisuras antes de presentarla.' },
                    { label: 'Antes de interponer recursos', detalle: 'Chequee que los agravios sean consistentes entre sí.' },
                    { label: 'Al revisar estrategias heredadas', detalle: 'Cuando toma un caso de otro abogado y necesita evaluar lo actuado.' },
                    { label: 'En casos con múltiples imputados', detalle: 'Para detectar si la estrategia de uno perjudica a otro.' },
                ]
            },
        ]
    },
    {
        id: 'redactar',
        icono: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
        ),
        titulo: 'Redactar Escrito',
        bloques: [
            {
                subtitulo: '¿Qué hace?',
                tipo: 'texto',
                texto: 'Genera un borrador estructurado de un escrito defensivo (excepción, recurso, alegato, etc.) con secciones profesionales, citas normativas y argumento defensivo. Las partes que requieren datos específicos del expediente se marcan explícitamente para completar.'
            },
            {
                subtitulo: 'Dos formas de cargar los datos',
                tipo: 'texto',
                texto: 'Desde un informe de análisis (botón "Redactar Escrito" al pie), el borrador arranca con el imputado, la causa, los hechos y la pretensión sugerida ya precargados desde el expediente analizado. También puede cargar todo manualmente desde cero.'
            },
            {
                subtitulo: 'Importante',
                tipo: 'advertencia',
                texto: 'Todo borrador generado es un punto de partida. Requiere obligatoriamente su revisión y adecuación profesional antes de presentarlo. Verifique especialmente los datos precargados y complete los que el sistema marque como faltantes.',
            },
        ]
    },
    {
        id: 'imagenes',
        icono: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
        ),
        titulo: 'Documentación Adjunta',
        bloques: [
            {
                subtitulo: 'PDFs del expediente',
                tipo: 'lista',
                items: [
                    { label: '¿Para qué sirve?', detalle: 'Adjunte pericias completas, declaraciones testimoniales, actas de allanamiento o cualquier documento del expediente en PDF. El sistema los lee íntegramente y contrasta las conclusiones de la acusación contra los hallazgos objetivos documentados.' },
                    { label: 'Formatos y límites', detalle: 'PDF · máx. 2 archivos · máx. 10 MB por archivo' },
                    { label: 'Caso de uso típico', detalle: 'Pericia médico-forense: el sistema verifica si las conclusiones exceden los hallazgos, si falta metodología validada (SVA/CBCA/NICHD) o si la pericia invade la función del juez.' },
                ]
            },
            {
                subtitulo: 'Imágenes del expediente',
                tipo: 'lista',
                items: [
                    { label: '¿Para qué sirve?', detalle: 'Adjunte capturas de WhatsApp, fotos de evidencia física, pericias escaneadas o escritos manuscritos. El sistema las analiza visualmente junto con el texto.' },
                    { label: 'Formatos y límites', detalle: 'JPG, PNG, WebP · máx. 4 imágenes · máx. 4 MB por imagen' },
                    { label: 'Cómo adjuntar', detalle: 'Arrastre las imágenes a la zona de carga, o haga clic para seleccionarlas desde su dispositivo.' },
                ]
            },
            {
                subtitulo: 'Análisis de metadatos EXIF',
                tipo: 'lista',
                items: [
                    { label: '¿Qué es?', detalle: 'Al adjuntar una imagen, el sistema extrae automáticamente los metadatos EXIF: dispositivo de captura, fecha y hora, software de edición, presencia de GPS.' },
                    { label: 'Imagen sin metadatos EXIF', detalle: 'Alerta defensiva automática: puede indicar captura de pantalla sin certificación, imagen editada que perdió metadatos, o imagen de origen incierto. La defensa puede señalar este vicio en la cadena de custodia digital (art. 244 CPP PBA).' },
                    { label: 'Imagen editada con software', detalle: 'Si los metadatos revelan edición con Photoshop, Lightroom, GIMP u otros, el sistema alerta sobre el compromiso de autenticidad como prueba digital.' },
                    { label: 'Moderación automática', detalle: 'El sistema rechaza imágenes con contenido inapropiado. Solo se admiten imágenes vinculadas al expediente judicial.' },
                ]
            },
        ]
    },
    {
        id: 'historial',
        icono: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
        ),
        titulo: 'Historial de Análisis',
        bloques: [
            {
                subtitulo: '¿Qué es?',
                tipo: 'texto',
                texto: 'Cada análisis realizado queda registrado en su historial personal. Puede consultarlo en cualquier momento desde el menú "Historial". Los registros son privados: cada usuario solo ve sus propios análisis.'
            },
            {
                subtitulo: 'Cómo usarlo',
                tipo: 'lista',
                items: [
                    { label: 'Acceder al historial', detalle: 'Menú lateral → "Historial". Se listan los análisis ordenados por fecha, con el número de informe, estado (Aprobado / Limitado / Rechazado) y extracto de los hechos.' },
                    { label: 'Reabrir un análisis', detalle: 'Haga clic en cualquier entrada del historial para ver el informe completo. El sistema abre directamente en la Estrategia Defensiva (Paso 2), ya que el encuadre fue validado en su momento.' },
                    { label: 'Exportar desde el historial', detalle: 'Una vez abierto el análisis, puede descargarlo en PDF o Word desde los botones en la parte inferior.' },
                ]
            },
        ]
    },
    {
        id: 'exportar',
        icono: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
        ),
        titulo: 'Exportar PDF y Word',
        bloques: [
            {
                subtitulo: '¿Cómo funciona?',
                tipo: 'texto',
                texto: 'Al pie de cada informe hay dos botones de descarga directa: "Descargar Informe PDF" genera un PDF profesional del informe, y "Descargar en Word" genera un archivo .docx editable. No se usa el diálogo de impresión — el archivo se descarga a su dispositivo.'
            },
            {
                subtitulo: 'Recomendaciones',
                tipo: 'tips',
                items: [
                    'Para borradores de escritos judiciales use la descarga en Word: el .docx queda editable para completar los datos del expediente, adecuar y firmar antes de presentar.',
                    'En los análisis de caso, los botones de descarga solo están disponibles en el Paso 2 (Estrategia Defensiva) — no en el Paso 1 de verificación.',
                ]
            },
        ]
    },
    {
        id: 'faq',
        icono: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
        ),
        titulo: 'Preguntas Frecuentes',
        bloques: [
            {
                tipo: 'faq',
                items: [
                    {
                        pregunta: '¿El sistema reemplaza al abogado?',
                        respuesta: 'No. Es una herramienta de apoyo al criterio profesional. El análisis jurídico final, la estrategia y la responsabilidad son siempre del abogado. El sistema no tiene patrocinio ni ejerce la profesión.'
                    },
                    {
                        pregunta: '¿Qué pasa si el sistema rechaza mi consulta?',
                        respuesta: 'El rechazo es fundado: el mensaje explica por qué. Las causas más comunes son: materia ajena al fuero penal, información insuficiente para el análisis, o consulta fuera del alcance del CPP PBA. Lea el mensaje y reformule con más detalle.'
                    },
                    {
                        pregunta: '¿Cubre toda la provincia de Buenos Aires?',
                        respuesta: 'Sí. Opera sobre el CPP PBA (Ley 11.922) que rige en todos los departamentos judiciales de la provincia. Para causas federales o de CABA, el sistema no aplica.'
                    },
                    {
                        pregunta: '¿Puedo usar los informes en el expediente?',
                        respuesta: 'Los informes son herramientas de trabajo interno, no documentos de presentación judicial. Son insumo para su propio análisis y redacción. No están firmados por letrado ni reemplazan un dictamen profesional.'
                    },
                    {
                        pregunta: '¿Con qué frecuencia se actualiza el corpus?',
                        respuesta: 'El corpus CPP PBA y Código Penal se mantiene actualizado. Las modificaciones legislativas y criterios jurisprudenciales relevantes se incorporan periódicamente sin costo adicional para el suscriptor.'
                    },
                    {
                        pregunta: '¿Mis consultas son confidenciales?',
                        respuesta: 'Las consultas se procesan para generar el análisis y no se comparten con terceros. No ingrese datos de identidad del imputado — utilice iniciales o referencias genéricas como "mi cliente" o "el imputado".'
                    },
                ]
            }
        ]
    },
]

function Manual() {
    return (
        <div className="manual">
            <header className="manual__header">
                <h1 className="manual__title">Guía de Uso</h1>
                <p className="manual__subtitle">
                    Alcance Legal Penal · Sistema de Inteligencia Jurídica Defensiva — CPP PBA
                </p>
            </header>

            <div className="manual__body">
                {secciones.map((sec) => (
                    <section key={sec.id} className="manual__seccion" id={sec.id}>
                        <div className="manual__seccion-header">
                            <div className="manual__seccion-icono">{sec.icono}</div>
                            <div>
                                <h2 className="manual__seccion-titulo">{sec.titulo}</h2>
                                {sec.badge && <span className="manual__badge">{sec.badge}</span>}
                            </div>
                        </div>

                        {sec.bloques.map((bloque, bi) => (
                            <div key={bi} className="manual__bloque">
                                {bloque.subtitulo && (
                                    <h3 className="manual__bloque-titulo">{bloque.subtitulo}</h3>
                                )}

                                {bloque.tipo === 'texto' && (
                                    <p className="manual__texto">{bloque.texto}</p>
                                )}

                                {bloque.tipo === 'advertencia' && (
                                    <div className="manual__advertencia">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                                        </svg>
                                        <p>{bloque.texto}</p>
                                    </div>
                                )}

                                {bloque.tipo === 'lista' && (
                                    <ul className="manual__lista">
                                        {bloque.items.map((item, ii) => (
                                            <li key={ii} className="manual__lista-item">
                                                <strong>{item.label}</strong>
                                                <span>{item.detalle}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {bloque.tipo === 'pasos' && (
                                    <ol className="manual__pasos">
                                        {bloque.items.map((item, ii) => (
                                            <li key={ii} className="manual__paso">
                                                <span className="manual__paso-num">{item.num}</span>
                                                <div>
                                                    <strong>{item.label}</strong>
                                                    <p>{item.detalle}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                )}

                                {bloque.tipo === 'flujo' && (
                                    <div className="manual__flujo">
                                        {bloque.items.map((item, ii) => (
                                            <div key={ii} className="manual__flujo-paso">
                                                <span className="manual__flujo-icono">{item.icono}</span>
                                                <strong>{item.label}</strong>
                                                <p>{item.detalle}</p>
                                                {ii < bloque.items.length - 1 && (
                                                    <svg className="manual__flujo-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <line x1="5" y1="12" x2="19" y2="12"/>
                                                        <polyline points="12 5 19 12 12 19"/>
                                                    </svg>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {bloque.tipo === 'tips' && (
                                    <ul className="manual__tips">
                                        {bloque.items.map((tip, ii) => (
                                            <li key={ii} className="manual__tip">
                                                <span className="manual__tip-dot" />
                                                {tip}
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {bloque.tipo === 'faq' && (
                                    <div className="manual__faq">
                                        {bloque.items.map((item, ii) => (
                                            <div key={ii} className="manual__faq-item">
                                                <h4 className="manual__faq-pregunta">{item.pregunta}</h4>
                                                <p className="manual__faq-respuesta">{item.respuesta}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </section>
                ))}
            </div>

            <footer className="manual__footer">
                <p>
                    Alcance Legal Penal opera exclusivamente sobre causas del <strong>Fuero Penal — Provincia de Buenos Aires</strong>.
                    Los fueros civil, comercial, laboral y familia están excluidos.
                </p>
                <p className="manual__footer-nota">
                    Versión beta · Desarrollado por Studio Lamas
                </p>
            </footer>
        </div>
    )
}

export default Manual
