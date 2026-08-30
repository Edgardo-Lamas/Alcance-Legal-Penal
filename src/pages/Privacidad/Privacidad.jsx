import { Link } from 'react-router-dom'
import './Privacidad.css'

/**
 * Tratamiento de datos y confidencialidad.
 *
 * Página pública: el abogado tiene que poder leerla ANTES de cargar
 * un expediente, no después. Describe el circuito real de los datos,
 * no una versión edulcorada — si el texto de una causa sale hacia un
 * tercero, acá está dicho con nombre y apellido.
 *
 * Las políticas de los proveedores se verificaron contra su documentación
 * oficial el 2026-08-30 (ver FECHA_VERIFICACION). Al actualizar esta página
 * hay que volver a verificarlas: cambian sin aviso.
 */

const FECHA_VIGENCIA = '30 de agosto de 2026'
const FECHA_VERIFICACION = '30 de agosto de 2026'

const proveedores = [
    {
        nombre: 'Anthropic (Claude)',
        pais: 'Estados Unidos',
        recibe: 'El relato de los hechos y hasta 20.000 caracteres del texto del expediente que usted haya incorporado.',
        usadoPara: 'Redactar el análisis, la auditoría de estrategia y los escritos.',
        entrena: 'No entrena sus modelos con el contenido enviado por la API.',
        retiene: 'Elimina los datos dentro de los 30 días de recibidos, salvo requerimiento legal o investigación por violación de sus políticas de uso.',
        enlace: 'https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-data',
    },
    {
        nombre: 'Google (Gemini)',
        pais: 'Estados Unidos',
        recibe: 'El texto de las actuaciones incorporadas al caso, que es el volumen más grande de los tres.',
        usadoPara: 'Localizar los pasajes críticos del expediente y citarlos textualmente para el análisis.',
        entrena: 'En cuentas con facturación habilitada, Google no utiliza las consultas ni las respuestas para mejorar sus productos. Alcance Legal Penal opera exclusivamente sobre ese tipo de cuenta.',
        retiene: 'Conserva registros por un plazo limitado, con el único fin de detectar y prevenir usos prohibidos.',
        enlace: 'https://ai.google.dev/gemini-api/terms',
    },
    {
        nombre: 'OpenAI',
        pais: 'Estados Unidos',
        recibe: 'Un extracto acotado: la pretensión defensiva, el tipo penal, la etapa procesal y los primeros 400 caracteres de los hechos. No recibe el expediente.',
        usadoPara: 'Convertir esa consulta en un vector para buscar criterios jurídicos análogos en el corpus del sistema.',
        entrena: 'No entrena sus modelos con datos enviados por la API, salvo consentimiento expreso que no otorgamos.',
        retiene: 'Hasta 30 días en registros de monitoreo de abuso, salvo que la ley exija un plazo mayor.',
        enlace: 'https://developers.openai.com/api/docs/guides/your-data',
    },
]

function Privacidad() {
    return (
        <div className="privacidad-screen">
            <div className="privacidad-container">

                <header className="privacidad-header">
                    <Link to="/login" className="privacidad-back">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        Volver al inicio de sesión
                    </Link>

                    <div className="privacidad-logo">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 3v18" />
                            <path d="M5 6l7-3 7 3" />
                            <path d="M5 6v6a7 7 0 0 0 7 7 7 7 0 0 0 7-7V6" />
                        </svg>
                    </div>

                    <h1 className="privacidad-title">Tratamiento de datos y confidencialidad</h1>
                    <p className="privacidad-subtitle">
                        Alcance Legal Penal · Vigente desde el {FECHA_VIGENCIA}
                    </p>
                </header>

                {/* Resumen honesto, arriba de todo */}
                <section className="privacidad-resumen">
                    <h2>Lo esencial, en cuatro líneas</h2>
                    <p>
                        Para producir un análisis, el sistema <strong>envía el material de su causa a servicios de
                        inteligencia artificial de terceros, radicados en los Estados Unidos</strong>. No hay forma de
                        generar el informe sin ese envío. Ninguno de esos proveedores utiliza el contenido para entrenar
                        sus modelos, y todos lo eliminan en plazos acotados, pero el dato sale de la Argentina y sale de
                        su estudio.
                    </p>
                    <p>
                        Usted decide qué carga. Esta página existe para que esa decisión sea informada.
                    </p>
                </section>

                {/* 1 */}
                <section className="privacidad-seccion">
                    <h2><span className="privacidad-num">1</span> Qué información recibe el sistema</h2>
                    <ul className="privacidad-lista">
                        <li><strong>Lo que usted escribe:</strong> el relato de los hechos, el tipo penal, la etapa procesal y la pretensión defensiva.</li>
                        <li><strong>Lo que trae la extensión MEV Navigator:</strong> la carátula de la causa y el texto de las actuaciones que usted seleccione. Ese texto viaja <em>tal como está en el expediente</em>, con los nombres, fechas y datos que contenga.</li>
                        <li><strong>Los archivos que adjunte:</strong> pericias, actas o capturas, en los planes que lo permiten.</li>
                        <li><strong>Datos de su cuenta:</strong> correo electrónico, plan contratado y consumo mensual.</li>
                    </ul>
                    <p className="privacidad-nota">
                        El sistema no accede a su sesión de la Mesa de Entradas Virtual ni guarda sus credenciales del
                        Poder Judicial. La extensión lee únicamente la causa que usted tiene abierta en pantalla, cuando
                        usted se lo pide.
                    </p>
                </section>

                {/* 2 */}
                <section className="privacidad-seccion">
                    <h2><span className="privacidad-num">2</span> Hacia dónde va ese material</h2>
                    <p className="privacidad-intro">
                        Tres proveedores intervienen en cada análisis. Esto es lo que recibe cada uno, para qué, y qué
                        hace después con eso según su propia documentación oficial, verificada el {FECHA_VERIFICACION}:
                    </p>

                    <div className="privacidad-proveedores">
                        {proveedores.map((p) => (
                            <article className="proveedor-card" key={p.nombre}>
                                <header className="proveedor-header">
                                    <h3>{p.nombre}</h3>
                                    <span className="proveedor-pais">{p.pais}</span>
                                </header>
                                <dl className="proveedor-datos">
                                    <dt>Qué recibe</dt>
                                    <dd>{p.recibe}</dd>
                                    <dt>Para qué</dt>
                                    <dd>{p.usadoPara}</dd>
                                    <dt>Entrenamiento</dt>
                                    <dd>{p.entrena}</dd>
                                    <dt>Retención</dt>
                                    <dd>{p.retiene}</dd>
                                </dl>
                                <a className="proveedor-enlace" href={p.enlace} target="_blank" rel="noopener noreferrer">
                                    Política del proveedor ↗
                                </a>
                            </article>
                        ))}
                    </div>
                </section>

                {/* 3 */}
                <section className="privacidad-seccion">
                    <h2><span className="privacidad-num">3</span> Qué conserva Alcance Legal Penal</h2>
                    <p>
                        En nuestra base de datos, alojada en Supabase, queda guardado el <strong>relato de los hechos
                        que usted cargó y el informe completo que produjo el sistema</strong>, asociados a su cuenta.
                        Es lo que le permite volver a un análisis desde el Historial.
                    </p>
                    <p>
                        <strong>No se guarda el texto íntegro de las actuaciones traídas del expediente</strong>: se usa
                        para producir el informe y no se persiste.
                    </p>
                    <p>
                        Cada análisis es visible únicamente para la cuenta que lo generó. Ningún otro suscriptor puede
                        acceder a él, y la restricción está aplicada en la base de datos, no sólo en la pantalla.
                    </p>
                    <p>
                        Puede pedir la <strong>supresión de cualquier análisis, o de todos</strong>, escribiendo a la
                        dirección del pie. Se ejecuta dentro de los 5 días hábiles.
                    </p>
                </section>

                {/* 4 */}
                <section className="privacidad-seccion">
                    <h2><span className="privacidad-num">4</span> Quién responde por estos datos</h2>
                    <p>
                        El material de una causa penal contiene datos sensibles, y con frecuencia datos de terceros que
                        no son su cliente —una víctima, un testigo, un menor—. Esa responsabilidad no cambia de manos al
                        usar el sistema:
                    </p>
                    <ul className="privacidad-lista">
                        <li><strong>Usted es el responsable</strong> del tratamiento de los datos de su causa, y sigue alcanzado por el secreto profesional.</li>
                        <li><strong>Alcance Legal Penal es el encargado:</strong> trata esos datos únicamente para prestarle el servicio, siguiendo sus instrucciones.</li>
                        <li><strong>Los proveedores del punto 2 son subencargados:</strong> por eso están enumerados con nombre, y por eso se informa qué recibe cada uno.</li>
                    </ul>
                    <p className="privacidad-nota">
                        El tratamiento se rige por la Ley 25.326 de Protección de los Datos Personales. Como titular de
                        datos, cualquier persona puede ejercer sus derechos de acceso, rectificación y supresión ante la
                        dirección del pie, y reclamar ante la Agencia de Acceso a la Información Pública.
                    </p>
                </section>

                {/* 5 */}
                <section className="privacidad-seccion">
                    <h2><span className="privacidad-num">5</span> Qué no hacemos</h2>
                    <ul className="privacidad-lista privacidad-lista--no">
                        <li>No vendemos ni cedemos datos de causas a terceros con fines comerciales.</li>
                        <li>No entrenamos modelos propios con el material de sus expedientes.</li>
                        <li>No usamos el contenido de una causa para responder la consulta de otro suscriptor.</li>
                        <li>No leemos sus análisis para uso interno. Las métricas del panel de administración son recuentos, sin acceso al contenido.</li>
                    </ul>
                </section>

                {/* 6 */}
                <section className="privacidad-seccion privacidad-seccion--destacada">
                    <h2><span className="privacidad-num">6</span> Cómo reducir lo que sale de su estudio</h2>
                    <p>
                        Si prefiere no exponer identidades, puede <strong>cargar el caso a mano y reemplazar los nombres
                        por iniciales o referencias genéricas</strong> —“el imputado”, “la denunciante”—. El análisis
                        funciona igual: razona sobre los hechos y el derecho, no sobre quién es quién.
                    </p>
                    <p>
                        Tenga presente que <strong>esa cautela no se aplica sola al flujo del MEV</strong>: cuando trae
                        actuaciones del expediente, el texto se envía tal como figura allí. Si la causa es
                        especialmente sensible, seleccione menos actuaciones o cárguela manualmente.
                    </p>
                </section>

                {/* 7 */}
                <section className="privacidad-seccion">
                    <h2><span className="privacidad-num">7</span> Cambios en esta política</h2>
                    <p>
                        Si cambia el circuito de datos —un proveedor nuevo, un dato que empiece a guardarse— esta página
                        se actualiza y la fecha de vigencia cambia con ella. Los cambios que afecten qué se envía o qué
                        se conserva se avisan por correo antes de entrar en vigor.
                    </p>
                </section>

                <footer className="privacidad-footer">
                    <p>
                        Consultas sobre tratamiento de datos, o pedidos de supresión:{' '}
                        <a href="mailto:contacto@studiolamas.com?subject=Datos%20personales%20-%20Alcance%20Legal%20Penal" className="privacidad-mail">
                            contacto@studiolamas.com
                        </a>
                    </p>
                    <p className="privacidad-legal">
                        Vigente desde el {FECHA_VIGENCIA} · Políticas de proveedores verificadas el {FECHA_VERIFICACION}.
                    </p>
                    <Link to="/precios" className="privacidad-link-precios">Ver planes de suscripción</Link>
                </footer>

            </div>
        </div>
    )
}

export default Privacidad
