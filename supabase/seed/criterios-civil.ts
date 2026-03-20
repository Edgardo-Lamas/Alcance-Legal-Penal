/**
 * Corpus inicial — Alcance Legal Civil
 *
 * 26 criterios jurídicos verificados basados en el CCyC (Ley 26.994).
 * Cubren los institutos civiles más consultados en la práctica.
 *
 * Fuentes:
 * - Código Civil y Comercial de la Nación (Ley 26.994, vigente desde ago. 2015)
 * - InfoLEG: infoleg.gob.ar
 * - SAIJ: saij.gob.ar
 *
 * IMPORTANTE: Estos criterios fueron redactados para ser revisados y
 * validados por un profesional del derecho antes de usar en producción.
 * El campo `contenido` está optimizado para búsqueda semántica: describe
 * la situación jurídica en lenguaje cercano al del usuario, no solo la norma.
 */

export interface CriterioSeed {
  id: string
  instituto: string
  subtipo: string
  jurisdiccion: string
  alcance: string
  criterio: string
  regla_general: string
  articulos_ccyc: string[]
  nivel_autoridad: string
  /** Texto para generar embedding — debe sonar como el problema del cliente */
  contenido: string
}

export const CRITERIOS_CIVIL: CriterioSeed[] = [

  // ============================================================
  // RESPONSABILIDAD CIVIL EXTRACONTRACTUAL
  // ============================================================

  {
    id: 'RC-EXT-001',
    instituto: 'responsabilidad_civil',
    subtipo: 'extracontractual_antijuricidad',
    jurisdiccion: 'argentina_nacional',
    alcance: 'criterios_generales',
    criterio: 'Antijuricidad como presupuesto de la responsabilidad civil',
    regla_general:
      'Cualquier acción u omisión que cause un daño a otro es antijurídica si no está justificada. ' +
      'La antijuricidad es objetiva: basta que el acto viole el ordenamiento jurídico sin necesidad de intención.',
    articulos_ccyc: ['Art. 1717 CCyC', 'Art. 1718 CCyC'],
    nivel_autoridad: 'vinculante',
    contenido:
      'Una persona sufrió un daño causado por otra. El responsable dice que no tuvo intención de dañar. ' +
      'En derecho civil argentino, la falta de intención no exime de responsabilidad si la conducta fue objetivamente contraria al ordenamiento. ' +
      'Se evalúa si el acto u omisión que generó el daño estaba o no justificado por el derecho.',
  },

  {
    id: 'RC-EXT-002',
    instituto: 'responsabilidad_civil',
    subtipo: 'extracontractual_factor_subjetivo',
    jurisdiccion: 'argentina_nacional',
    alcance: 'criterios_generales',
    criterio: 'Culpa como factor de atribución subjetivo',
    regla_general:
      'La culpa consiste en la omisión de la diligencia debida según la naturaleza del acto y las circunstancias. ' +
      'Se aplica el estándar del hombre prudente: lo que haría una persona razonable en igual situación.',
    articulos_ccyc: ['Art. 1724 CCyC', 'Art. 1725 CCyC'],
    nivel_autoridad: 'vinculante',
    contenido:
      'Alguien actúo de forma descuidada o negligente y provocó un perjuicio. ' +
      'Para determinar si hubo culpa, se compara la conducta del responsable con la que habría tenido ' +
      'una persona diligente y prudente en las mismas circunstancias. La negligencia, imprudencia o impericia configuran culpa.',
  },

  {
    id: 'RC-EXT-003',
    instituto: 'responsabilidad_civil',
    subtipo: 'extracontractual_actividad_riesgosa',
    jurisdiccion: 'argentina_nacional',
    alcance: 'criterios_generales',
    criterio: 'Responsabilidad objetiva por actividad riesgosa o peligrosa',
    regla_general:
      'Quien realiza una actividad que crea riesgo o peligro para terceros responde objetivamente por los daños causados. ' +
      'El dueño y el guardián de la cosa riesgosa son solidariamente responsables. ' +
      'Solo se exime por caso fortuito, hecho del damnificado o de un tercero por quien no debe responder.',
    articulos_ccyc: ['Art. 1757 CCyC', 'Art. 1758 CCyC', 'Art. 1722 CCyC'],
    nivel_autoridad: 'vinculante',
    contenido:
      'Un accidente fue causado por una cosa peligrosa (auto, maquinaria, producto) o por una actividad riesgosa. ' +
      'El dueño o quien usa la cosa responde aunque no haya tenido culpa. ' +
      'Para eximirse debe probar que el daño se debió al propio damnificado, a un tercero ajeno, o a caso fortuito.',
  },

  {
    id: 'RC-EXT-004',
    instituto: 'responsabilidad_civil',
    subtipo: 'extracontractual_dependiente',
    jurisdiccion: 'argentina_nacional',
    alcance: 'criterios_generales',
    criterio: 'Responsabilidad del principal por el hecho del dependiente',
    regla_general:
      'El principal responde objetivamente por los daños que cause su dependiente en ejercicio o con ocasión de sus funciones. ' +
      'Basta que exista una relación de dependencia fáctica; no se requiere dependencia laboral formal.',
    articulos_ccyc: ['Art. 1753 CCyC'],
    nivel_autoridad: 'vinculante',
    contenido:
      'Un empleado o dependiente causó un daño a un tercero mientras realizaba sus tareas o en ocasión del trabajo. ' +
      'El empleador o principal responde por ese daño aunque no haya tenido participación directa. ' +
      'La víctima puede demandar al empleador directamente, sin necesidad de probar culpa del principal.',
  },

  {
    id: 'RC-EXT-005',
    instituto: 'responsabilidad_civil',
    subtipo: 'extracontractual_nexo_causal',
    jurisdiccion: 'argentina_nacional',
    alcance: 'criterios_generales',
    criterio: 'Nexo de causalidad adecuada',
    regla_general:
      'Solo son resarcibles las consecuencias causalmente vinculadas al hecho ilícito según el criterio de causalidad adecuada: ' +
      'las que son consecuencia previsible según el curso normal y ordinario de las cosas.',
    articulos_ccyc: ['Art. 1726 CCyC', 'Art. 1727 CCyC'],
    nivel_autoridad: 'vinculante',
    contenido:
      'Se discute si el daño que sufrió la víctima fue realmente consecuencia del hecho del demandado. ' +
      'Se debe analizar si, según el curso normal de las cosas, ese resultado era previsible como consecuencia de la acción. ' +
      'Si hubo una causa ajena que interrumpió el nexo causal (caso fortuito, hecho de un tercero, hecho de la víctima), el responsable puede quedar exento.',
  },

  // ============================================================
  // DAÑO RESARCIBLE
  // ============================================================

  {
    id: 'DA-001',
    instituto: 'dano_resarcible',
    subtipo: 'patrimonial_emergente',
    jurisdiccion: 'argentina_nacional',
    alcance: 'criterios_generales',
    criterio: 'Daño emergente: gastos y pérdidas efectivas',
    regla_general:
      'El daño emergente comprende el perjuicio efectivamente sufrido: gastos médicos, reparaciones, ' +
      'honorarios profesionales y toda pérdida patrimonial directa causada por el hecho ilícito o el incumplimiento.',
    articulos_ccyc: ['Art. 1738 CCyC', 'Art. 1739 CCyC'],
    nivel_autoridad: 'vinculante',
    contenido:
      'La víctima de un daño tuvo gastos directos como consecuencia del hecho: médicos, reparaciones, honorarios, ' +
      'o cualquier desembolso que no hubiera tenido que hacer si el daño no hubiera ocurrido. ' +
      'Esos gastos deben ser acreditados y son resarcibles como daño emergente.',
  },

  {
    id: 'DA-002',
    instituto: 'dano_resarcible',
    subtipo: 'lucro_cesante',
    jurisdiccion: 'argentina_nacional',
    alcance: 'criterios_generales',
    criterio: 'Lucro cesante: ganancias frustradas',
    regla_general:
      'El lucro cesante comprende las ganancias que la víctima dejó de percibir como consecuencia del hecho dañoso. ' +
      'Debe acreditarse la probabilidad cierta de obtener ese ingreso; las ganancias meramente hipotéticas no son resarcibles.',
    articulos_ccyc: ['Art. 1738 CCyC'],
    nivel_autoridad: 'vinculante',
    contenido:
      'Por el accidente o el incumplimiento, la víctima no pudo trabajar, perdió clientes, o dejó de percibir ingresos que normalmente hubiera obtenido. ' +
      'Para reclamar lucro cesante debe acreditarse que esos ingresos eran probables y ciertos, no meramente hipotéticos.',
  },

  {
    id: 'DA-003',
    instituto: 'dano_resarcible',
    subtipo: 'moral_extrapatrimonial',
    jurisdiccion: 'argentina_nacional',
    alcance: 'criterios_generales',
    criterio: 'Daño extrapatrimonial (moral): afectación a la dignidad y bienestar',
    regla_general:
      'El daño extrapatrimonial (moral) comprende las consecuencias no patrimoniales del hecho: sufrimiento, angustia, ' +
      'menoscabo a la dignidad, al proyecto de vida o a la integridad psicofísica. ' +
      'Está legitimado para reclamarlo el damnificado directo; en caso de muerte, los ascendientes, descendientes y cónyuge o conviviente.',
    articulos_ccyc: ['Art. 1741 CCyC', 'Art. 1742 CCyC'],
    nivel_autoridad: 'vinculante',
    contenido:
      'Además del daño económico, la víctima sufrió angustia, dolor, humillación o un impacto emocional significativo. ' +
      'El daño moral es resarcible en forma autónoma del daño patrimonial. ' +
      'Su cuantificación queda a criterio del juez, quien debe valorar la entidad del sufrimiento y las circunstancias del caso.',
  },

  // ============================================================
  // CONTRATOS: INCUMPLIMIENTO Y RESOLUCIÓN
  // ============================================================

  {
    id: 'CT-INC-001',
    instituto: 'contratos',
    subtipo: 'incumplimiento_resolucion',
    jurisdiccion: 'argentina_nacional',
    alcance: 'criterios_generales',
    criterio: 'Resolución del contrato por incumplimiento',
    regla_general:
      'En los contratos bilaterales, el incumplimiento de una parte habilita a la otra a optar entre exigir el cumplimiento ' +
      'o resolver el contrato, en ambos casos con daños y perjuicios. ' +
      'La resolución opera de pleno derecho si fue pactada expresamente, o por notificación fehaciente al incumplidor.',
    articulos_ccyc: ['Art. 1083 CCyC', 'Art. 1084 CCyC', 'Art. 1086 CCyC'],
    nivel_autoridad: 'vinculante',
    contenido:
      'Una de las partes del contrato no cumplió con su obligación. La otra parte quiere salir del contrato y reclamar daños. ' +
      'Tiene dos opciones: exigir que cumpla o resolver (terminar) el contrato. En ambos casos puede reclamar los daños sufridos. ' +
      'Para resolver, basta notificar fehacientemente al incumplidor si el incumplimiento fue esencial.',
  },

  {
    id: 'CT-INC-002',
    instituto: 'contratos',
    subtipo: 'incumplimiento_excepcion',
    jurisdiccion: 'argentina_nacional',
    alcance: 'criterios_generales',
    criterio: 'Excepción de incumplimiento contractual',
    regla_general:
      'En los contratos de prestaciones recíprocas, una parte puede suspender su propio cumplimiento si la otra no cumplió ' +
      'o no ofrece cumplir simultáneamente. La excepción es proporcional: solo suspende hasta que el otro cumpla o garantice.',
    articulos_ccyc: ['Art. 1031 CCyC'],
    nivel_autoridad: 'vinculante',
    contenido:
      'Una persona no pagó o no cumplió su parte del contrato alegando que la otra tampoco cumplió. ' +
      'En contratos donde ambas partes deben cumplir recíprocamente, una parte puede legítimamente negarse a cumplir ' +
      'mientras la otra no cumpla o no ofrezca cumplir lo que le corresponde.',
  },

  {
    id: 'CT-INC-003',
    instituto: 'contratos',
    subtipo: 'clausula_penal',
    jurisdiccion: 'argentina_nacional',
    alcance: 'criterios_generales',
    criterio: 'Cláusula penal: liquidación anticipada de daños',
    regla_general:
      'La cláusula penal es una estimación anticipada de los daños por incumplimiento. ' +
      'El acreedor no necesita probar el daño efectivo para ejecutarla. ' +
      'El juez puede reducirla si es desproporcionada respecto al perjuicio real.',
    articulos_ccyc: ['Art. 790 CCyC', 'Art. 794 CCyC', 'Art. 794 CCyC'],
    nivel_autoridad: 'vinculante',
    contenido:
      'El contrato incluía una cláusula penal o multa para el caso de incumplimiento. ' +
      'La parte cumplidora quiere ejecutarla. El incumplidor puede pedir que la judicen la reduzca si la multa es excesiva ' +
      'en comparación con el daño real que sufrió la otra parte.',
  },

  // ============================================================
  // OBLIGACIONES: MORA
  // ============================================================

  {
    id: 'OB-MORA-001',
    instituto: 'obligaciones',
    subtipo: 'mora_automatica',
    jurisdiccion: 'argentina_nacional',
    alcance: 'criterios_generales',
    criterio: 'Mora automática del deudor en obligaciones a plazo',
    regla_general:
      'En las obligaciones con plazo determinado, la mora se produce automáticamente al vencimiento del plazo, ' +
      'sin necesidad de interpelación. No se requiere carta documento ni intimación previa.',
    articulos_ccyc: ['Art. 886 CCyC', 'Art. 887 CCyC'],
    nivel_autoridad: 'vinculante',
    contenido:
      'Una persona tenía que pagar o cumplir una obligación en una fecha determinada y no lo hizo. ' +
      'Desde el día siguiente al vencimiento, el deudor está en mora automáticamente y debe intereses y los daños causados por la demora. ' +
      'No es necesario enviar ninguna carta documento para que la mora quede configurada.',
  },

  {
    id: 'OB-MORA-002',
    instituto: 'obligaciones',
    subtipo: 'mora_interpelacion',
    jurisdiccion: 'argentina_nacional',
    alcance: 'criterios_generales',
    criterio: 'Mora por interpelación en obligaciones sin plazo determinado',
    regla_general:
      'Cuando no hay plazo determinado para el cumplimiento, la mora requiere interpelación previa: ' +
      'el acreedor debe exigir el cumplimiento de manera fehaciente (carta documento, acta notarial).',
    articulos_ccyc: ['Art. 887 CCyC', 'Art. 888 CCyC'],
    nivel_autoridad: 'vinculante',
    contenido:
      'Una persona debe cumplir una obligación pero no se fijó fecha de vencimiento. ' +
      'Para que el deudor esté en mora y deba intereses, el acreedor debe primero intimarlo fehacientemente. ' +
      'Sin esa intimación previa, no hay mora y el deudor no responde por los daños de la demora.',
  },

  // ============================================================
  // LOCACIÓN DE INMUEBLES
  // ============================================================

  {
    id: 'LOC-001',
    instituto: 'locacion',
    subtipo: 'duracion_minima',
    jurisdiccion: 'argentina_nacional',
    alcance: 'criterios_generales',
    criterio: 'Plazo mínimo de locación habitacional: tres años',
    regla_general:
      'El plazo mínimo de la locación de inmueble con destino habitacional es de tres años. ' +
      'Las cláusulas que establezcan plazos menores son nulas y se tienen por no escritas; rige el mínimo legal.',
    articulos_ccyc: ['Art. 1198 CCyC', 'Art. 1199 CCyC'],
    nivel_autoridad: 'vinculante',
    contenido:
      'El propietario quiere desalojar al inquilino alegando que el contrato venció antes de los tres años. ' +
      'O el contrato fue firmado por menos de tres años. El plazo mínimo legal para locación habitacional es tres años; ' +
      'cualquier cláusula que lo reduzca es nula y el locatario puede permanecer hasta cumplir ese plazo.',
  },

  {
    id: 'LOC-002',
    instituto: 'locacion',
    subtipo: 'rescision_anticipada_locatario',
    jurisdiccion: 'argentina_nacional',
    alcance: 'criterios_generales',
    criterio: 'Rescisión anticipada por el locatario',
    regla_general:
      'El locatario puede rescindir el contrato en cualquier momento notificando con 30 días de anticipación. ' +
      'Si rescinde antes de los seis meses, debe abonar una indemnización equivalente a un mes y medio de alquiler. ' +
      'Si rescinde después de los seis meses, la indemnización es de un mes.',
    articulos_ccyc: ['Art. 1221 CCyC'],
    nivel_autoridad: 'vinculante',
    contenido:
      'El inquilino quiere irse antes de que venza el contrato de alquiler. Tiene derecho a hacerlo, ' +
      'pero debe avisar con 30 días de anticipación. Si se va en los primeros seis meses paga un mes y medio de indemnización; ' +
      'después de los seis meses, solo un mes de alquiler.',
  },

  {
    id: 'LOC-003',
    instituto: 'locacion',
    subtipo: 'obligaciones_locador',
    jurisdiccion: 'argentina_nacional',
    alcance: 'criterios_generales',
    criterio: 'Obligación del locador de mantener el inmueble en condiciones de uso',
    regla_general:
      'El locador está obligado a entregar el inmueble en buen estado y mantenerlo apto para el destino pactado durante todo el contrato. ' +
      'Las reparaciones necesarias para conservar el inmueble son a cargo del locador; las locativas menores son del locatario.',
    articulos_ccyc: ['Art. 1200 CCyC', 'Art. 1201 CCyC', 'Art. 1207 CCyC'],
    nivel_autoridad: 'vinculante',
    contenido:
      'El inmueble alquilado tiene problemas estructurales, filtraciones, o dejó de ser habitable. ' +
      'El propietario se niega a hacer las reparaciones. El locador tiene la obligación legal de mantener el inmueble ' +
      'en condiciones aptas para el uso pactado; si no lo hace, el inquilino puede retener el alquiler o resolver el contrato.',
  },

  // ============================================================
  // VICIOS REDHIBITORIOS
  // ============================================================

  {
    id: 'VR-001',
    instituto: 'vicios_redhibitorios',
    subtipo: 'defecto_oculto',
    jurisdiccion: 'argentina_nacional',
    alcance: 'criterios_generales',
    criterio: 'Vicios redhibitorios: defectos ocultos que hacen la cosa impropia para su destino',
    regla_general:
      'Son vicios redhibitorios los defectos ocultos de la cosa, cuya existencia al tiempo de la adquisición el adquirente no conocía ni podía conocer, ' +
      'que la hacen impropia para su destino o disminuyen su utilidad de modo que el adquirente no la habría comprado o pagado menos precio.',
    articulos_ccyc: ['Art. 1051 CCyC', 'Art. 1052 CCyC'],
    nivel_autoridad: 'vinculante',
    contenido:
      'Se compró un inmueble, auto u otro bien y aparecieron defectos graves que no eran visibles al momento de la compra. ' +
      'El vendedor no advirtió sobre esos problemas. Si el comprador hubiera conocido esos defectos, no habría comprado o habría pagado menos. ' +
      'Puede reclamar la reducción del precio o la resolución de la compraventa.',
  },

  {
    id: 'VR-002',
    instituto: 'vicios_redhibitorios',
    subtipo: 'acciones_disponibles',
    jurisdiccion: 'argentina_nacional',
    alcance: 'criterios_generales',
    criterio: 'Acciones por vicios redhibitorios: redhibición o reducción de precio',
    regla_general:
      'El adquirente puede optar entre resolver el contrato (acción redhibitoria) o reducir el precio (acción quanti minoris). ' +
      'Si el vendedor conocía o debía conocer los vicios, también responde por los daños y perjuicios.',
    articulos_ccyc: ['Art. 1056 CCyC', 'Art. 1057 CCyC'],
    nivel_autoridad: 'vinculante',
    contenido:
      'El comprador descubrió vicios ocultos en lo que adquirió. Tiene dos opciones: devolver la cosa y recuperar el precio (rescisión), ' +
      'o quedarse con la cosa y pedir que se le devuelva parte del precio equivalente a la disminución de valor. ' +
      'Si el vendedor sabía del defecto y no lo informó, también responde por los daños.',
  },

  // ============================================================
  // PRESCRIPCIÓN
  // ============================================================

  {
    id: 'PRESC-001',
    instituto: 'prescripcion',
    subtipo: 'plazo_general',
    jurisdiccion: 'argentina_nacional',
    alcance: 'criterios_generales',
    criterio: 'Plazo general de prescripción: cinco años',
    regla_general:
      'El plazo de prescripción genérico es de cinco años, salvo que esté previsto uno especial. ' +
      'Se computa desde que la obligación es exigible o desde que el titular conoció o pudo conocer el daño.',
    articulos_ccyc: ['Art. 2560 CCyC', 'Art. 2554 CCyC'],
    nivel_autoridad: 'vinculante',
    contenido:
      'Ha pasado tiempo desde que ocurrió el daño o el incumplimiento y la parte afectada no inició acciones. ' +
      'El plazo general para demandar es de cinco años. Si ese plazo se cumplió sin accionar, la deuda prescribió ' +
      'y el demandado puede oponerlo como defensa.',
  },

  {
    id: 'PRESC-002',
    instituto: 'prescripcion',
    subtipo: 'plazo_danos',
    jurisdiccion: 'argentina_nacional',
    alcance: 'criterios_generales',
    criterio: 'Prescripción de tres años para responsabilidad civil',
    regla_general:
      'La acción por responsabilidad civil prescribe a los tres años desde que el damnificado conoció o pudo conocer el daño y su autor. ' +
      'Este plazo aplica a acciones por daños extracontractuales.',
    articulos_ccyc: ['Art. 2561 CCyC'],
    nivel_autoridad: 'vinculante',
    contenido:
      'Un accidente o hecho dañoso ocurrió hace más de tres años y la víctima no demandó. ' +
      'O la víctima recién conoció quién fue el responsable recientemente. ' +
      'El plazo para demandar por daños es de tres años desde que la víctima supo del daño y pudo identificar al responsable.',
  },

  {
    id: 'PRESC-003',
    instituto: 'prescripcion',
    subtipo: 'interrupcion',
    jurisdiccion: 'argentina_nacional',
    alcance: 'criterios_generales',
    criterio: 'Interrupción de la prescripción por demanda judicial',
    regla_general:
      'La prescripción se interrumpe con la interposición de la demanda, aunque sea ante juez incompetente, ' +
      'y también por el reconocimiento de la deuda por el deudor. ' +
      'Interrumpido el plazo, comienza a correr uno nuevo desde que cesó la causa interruptiva.',
    articulos_ccyc: ['Art. 2546 CCyC', 'Art. 2545 CCyC'],
    nivel_autoridad: 'vinculante',
    contenido:
      'Se había iniciado una demanda o el deudor reconoció la deuda antes de que prescribiera. ' +
      'La demanda judicial o el reconocimiento del deudor interrumpen la prescripción: ' +
      'el plazo deja de correr y empieza uno nuevo desde que se resuelve o desde el reconocimiento.',
  },

  // ============================================================
  // USUCAPIÓN / PRESCRIPCIÓN ADQUISITIVA
  // ============================================================

  {
    id: 'USUC-001',
    instituto: 'derechos_reales',
    subtipo: 'usucapion_larga',
    jurisdiccion: 'argentina_nacional',
    alcance: 'criterios_generales',
    criterio: 'Usucapión larga: posesión continua de veinte años',
    regla_general:
      'Quien posee un inmueble de manera continua, ostensible y pacífica durante veinte años adquiere el dominio por prescripción adquisitiva larga, ' +
      'sin necesidad de justo título ni buena fe.',
    articulos_ccyc: ['Art. 1899 CCyC'],
    nivel_autoridad: 'vinculante',
    contenido:
      'Una persona ocupa o usa un terreno o inmueble desde hace muchos años sin ser el propietario legal. ' +
      'Si lleva veinte años en posesión continua, pública y pacífica puede iniciar un juicio de usucapión para obtener el título de propiedad. ' +
      'No importa si no tiene escritura ni si actuó de mala fe.',
  },

  {
    id: 'USUC-002',
    instituto: 'derechos_reales',
    subtipo: 'usucapion_corta',
    jurisdiccion: 'argentina_nacional',
    alcance: 'criterios_generales',
    criterio: 'Usucapión breve: posesión de diez años con justo título y buena fe',
    regla_general:
      'Quien posee un inmueble con justo título y buena fe durante diez años adquiere el dominio por prescripción adquisitiva breve.',
    articulos_ccyc: ['Art. 1898 CCyC'],
    nivel_autoridad: 'vinculante',
    contenido:
      'Una persona compró un inmueble de buena fe y con un título que parecía válido, pero luego surgió un problema con la titularidad. ' +
      'Si lleva diez años en posesión con ese título y de buena fe, puede adquirir el dominio por usucapión breve ' +
      'aunque el título original tuviera algún defecto.',
  },

  // ============================================================
  // CONTRATOS EN GENERAL
  // ============================================================

  {
    id: 'CT-GEN-001',
    instituto: 'contratos',
    subtipo: 'interpretacion_buena_fe',
    jurisdiccion: 'argentina_nacional',
    alcance: 'criterios_generales',
    criterio: 'Interpretación del contrato conforme a la buena fe',
    regla_general:
      'Los contratos deben interpretarse conforme a la buena fe, según lo que las partes verosímilmente entendieron al contratar. ' +
      'Las cláusulas ambiguas se interpretan a favor de la parte que no las redactó (contra proferentem).',
    articulos_ccyc: ['Art. 961 CCyC', 'Art. 1061 CCyC', 'Art. 1062 CCyC'],
    nivel_autoridad: 'vinculante',
    contenido:
      'Las partes tienen una disputa sobre qué significa una cláusula del contrato o cuál era la intención al firmarlo. ' +
      'El contrato debe interpretarse según lo que las partes razonablemente entendieron. ' +
      'Si una cláusula es confusa o ambigua, se interpreta en contra de quien la redactó y en favor de la parte más débil.',
  },

  {
    id: 'CT-GEN-002',
    instituto: 'contratos',
    subtipo: 'frustracion_fin',
    jurisdiccion: 'argentina_nacional',
    alcance: 'criterios_generales',
    criterio: 'Frustración de la finalidad del contrato',
    regla_general:
      'Si la finalidad que motivó a una parte a celebrar el contrato se frustra por una causa no imputable a ninguna de las partes, ' +
      'esa parte puede resolver el contrato sin responsabilidad.',
    articulos_ccyc: ['Art. 1090 CCyC'],
    nivel_autoridad: 'vinculante',
    contenido:
      'El contrato fue celebrado para un fin específico (un evento, una actividad, un uso determinado) y ese fin ya no puede cumplirse ' +
      'por circunstancias sobrevinientes ajenas a ambas partes. ' +
      'La parte afectada puede resolver el contrato sin tener que pagar daños.',
  },

  {
    id: 'CT-GEN-003',
    instituto: 'contratos',
    subtipo: 'nulidad_clausula_abusiva',
    jurisdiccion: 'argentina_nacional',
    alcance: 'criterios_generales',
    criterio: 'Nulidad de cláusulas abusivas en contratos de adhesión',
    regla_general:
      'Las cláusulas que establecen ventajas exorbitantes a favor del predisponente o desnaturalizan las obligaciones del adherente ' +
      'son nulas de nulidad parcial. Se tiene por no escrita la cláusula abusiva; el contrato continúa vigente sin ella.',
    articulos_ccyc: ['Art. 988 CCyC', 'Art. 989 CCyC'],
    nivel_autoridad: 'vinculante',
    contenido:
      'El contrato fue firmado en condiciones que no podían negociarse: todas las cláusulas las puso una sola parte. ' +
      'Alguna de esas cláusulas genera una desventaja muy grande para quien firmó (limitaciones abusivas, penalidades exorbitantes, renuncias injustificadas). ' +
      'Esas cláusulas pueden ser declaradas nulas sin que se caiga el contrato entero.',
  },

]
