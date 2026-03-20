/**
 * Corpus jurídico — Alcance Legal Penal
 * Perfil: Defensa Penal PBA
 *
 * 28 criterios cubriendo:
 * - Garantías constitucionales y procesales (in dubio, presunción, carga)
 * - Testimonio único en abuso sexual (requisitos de suficiencia)
 * - Perspectiva de género: límites constitucionales
 * - CP Art. 119: elementos del tipo objetivo
 * - Nulidades procesales (prueba ilícita, intimación, defensa)
 * - Valoración de la prueba (sana crítica, contradicción)
 * - Pericias forenses (médica y psicológica)
 * - Prisión preventiva (requisitos y plazo razonable)
 * - Garantías procesales (non bis in idem, doble conforme, silencio)
 * - Prueba de referencia y motivación espuria
 *
 * Normativa base:
 *   CPP PBA: Ley 11.922 (sistema acusatorio oral)
 *   CP: Código Penal de la Nación
 *   CN: Constitución Nacional
 *   CADH: Convención Americana sobre DDHH
 *   PIDCyP: Pacto Internacional de Derechos Civiles y Políticos
 */

export interface CriterioPenal {
  id: string
  instituto: string
  subtipo: string
  criterio: string
  regla_general: string
  articulos_cpp: string[]
  nivel_autoridad: 'vinculante' | 'orientativo'
  contenido: string   // texto para embedding
  alcance: 'criterios_generales'
  jurisdiccion: 'argentina_pba'
}

export const CRITERIOS_PENAL: CriterioPenal[] = [

  // ─────────────────────────────────────────────────────────────────
  // GARANTÍAS FUNDAMENTALES
  // ─────────────────────────────────────────────────────────────────

  {
    id: 'PN-IDP-001',
    instituto: 'garantias_procesales',
    subtipo: 'in_dubio_pro_reo',
    criterio: 'In dubio pro reo — aplicación ante duda razonable',
    regla_general:
      'La duda razonable sobre cualquier elemento del tipo objetivo o subjetivo, ' +
      'o sobre la participación del imputado, impone la absolución. ' +
      'No existe grado intermedio: ante la duda, el imputado debe ser absuelto. ' +
      'La certeza que exige la condena debe alcanzar a todos y cada uno de los elementos del delito.',
    articulos_cpp: ['CPP PBA Art. 1', 'CN Art. 18', 'CADH Art. 8.2', 'PIDCyP Art. 14.2'],
    nivel_autoridad: 'vinculante',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'In dubio pro reo aplicación ante duda razonable. ' +
      'La duda razonable sobre cualquier elemento del tipo objetivo o subjetivo, ' +
      'o sobre la participación del imputado, impone la absolución. ' +
      'Ante la duda, el imputado debe ser absuelto. La certeza requerida para condenar ' +
      'debe alcanzar a todos los elementos del delito.',
  },

  {
    id: 'PN-PI-001',
    instituto: 'garantias_procesales',
    subtipo: 'presuncion_inocencia',
    criterio: 'Presunción de inocencia — estado jurídico del imputado',
    regla_general:
      'El imputado es inocente hasta que una sentencia firme declare su culpabilidad. ' +
      'Esta garantía no cede frente a indicios, probabilidades, ni presunciones de culpabilidad. ' +
      'El estado de inocencia rige durante todo el proceso penal y solo cesa con sentencia condenatoria firme. ' +
      'Ningún acto procesal puede tratarlo como culpable antes de esa sentencia.',
    articulos_cpp: ['CPP PBA Art. 1', 'CN Art. 18', 'CADH Art. 8.2', 'PIDCyP Art. 14.2'],
    nivel_autoridad: 'vinculante',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'Presunción de inocencia estado jurídico del imputado durante todo el proceso. ' +
      'El imputado es inocente hasta sentencia firme. ' +
      'No cede frente a indicios ni probabilidades. ' +
      'Ningún acto procesal puede tratar al imputado como culpable antes de la condena.',
  },

  {
    id: 'PN-CP-001',
    instituto: 'garantias_procesales',
    subtipo: 'carga_prueba',
    criterio: 'Carga de la prueba — corresponde exclusivamente a la acusación',
    regla_general:
      'La carga de la prueba corresponde exclusivamente a la acusación. ' +
      'El imputado no tiene obligación de probar su inocencia ni de explicar los hechos. ' +
      'Cualquier intento de invertir esta carga — explícito o implícito — es inconstitucional. ' +
      'El silencio del imputado no puede interpretarse en su contra. ' +
      'La acusación debe probar todos los elementos del tipo penal más allá de toda duda razonable.',
    articulos_cpp: ['CPP PBA Art. 1', 'CN Art. 18', 'CADH Art. 8.2.g', 'PIDCyP Art. 14.3.g'],
    nivel_autoridad: 'vinculante',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'Carga de la prueba corresponde exclusivamente a la acusación. ' +
      'El imputado no tiene obligación de probar su inocencia. ' +
      'Invertir la carga probatoria es inconstitucional. ' +
      'El silencio del imputado no puede interpretarse en su contra.',
  },

  // ─────────────────────────────────────────────────────────────────
  // TESTIMONIO ÚNICO EN ABUSO SEXUAL
  // ─────────────────────────────────────────────────────────────────

  {
    id: 'PN-TU-001',
    instituto: 'valoracion_prueba',
    subtipo: 'testimonio_unico',
    criterio: 'Testimonio único — cuatro requisitos copulativos de suficiencia',
    regla_general:
      'El testimonio único de la denunciante puede ser prueba suficiente para condenar SOLO si ' +
      'reúne los cuatro requisitos copulativos: ' +
      '(1) persistencia temporal sin contradicciones relevantes en el núcleo del relato; ' +
      '(2) ausencia de motivación espuria acreditada; ' +
      '(3) corroboración periférica objetiva al menos parcial; ' +
      '(4) verosimilitud intrínseca del relato (coherencia interna). ' +
      'La ausencia o debilidad de cualquiera de estos factores activa el in dubio pro reo.',
    articulos_cpp: ['CPP PBA Art. 210', 'CP Art. 119', 'CN Art. 18'],
    nivel_autoridad: 'vinculante',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'Testimonio único cuatro requisitos copulativos de suficiencia en abuso sexual. ' +
      'El testimonio único de la denunciante solo puede condenar si reúne: ' +
      'persistencia sin contradicciones, ausencia de motivación espuria, ' +
      'corroboración periférica objetiva, y verosimilitud intrínseca. ' +
      'La falta de cualquiera activa el in dubio pro reo.',
  },

  {
    id: 'PN-TU-002',
    instituto: 'valoracion_prueba',
    subtipo: 'testimonio_unico',
    criterio: 'Testimonio único — factores que imponen examen crítico reforzado',
    regla_general:
      'El testimonio único requiere examen crítico especialmente reforzado cuando concurren: ' +
      'relación conflictiva preexistente entre denunciante e imputado; ' +
      'disputas sobre guarda, alimentos o régimen de visitas; ' +
      'demora prolongada e injustificada en la denuncia; ' +
      'variaciones sustanciales entre distintas versiones del relato; ' +
      'interés económico o ventaja procesal derivada de la denuncia. ' +
      'En estos supuestos, la sola declaración no puede fundar condena sin corroboración objetiva independiente.',
    articulos_cpp: ['CPP PBA Art. 209', 'CPP PBA Art. 210', 'CN Art. 18'],
    nivel_autoridad: 'orientativo',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'Testimonio único factores que imponen examen crítico reforzado en abuso sexual. ' +
      'Relación conflictiva preexistente, disputas de guarda o alimentos, demora en la denuncia, ' +
      'variaciones en el relato, interés económico o ventaja procesal. ' +
      'En estos casos la sola declaración no puede fundar condena sin corroboración objetiva.',
  },

  {
    id: 'PN-TU-003',
    instituto: 'valoracion_prueba',
    subtipo: 'testimonio_unico',
    criterio: 'Contradicción en el testimonio de cargo — distinción entre sustancial y periférica',
    regla_general:
      'Las contradicciones sustanciales entre distintas versiones del testimonio de cargo ' +
      '(denuncia inicial, declaración en IPP, cámara Gesell, juicio oral) impiden considerarlo ' +
      'suficiente para destruir la presunción de inocencia. ' +
      'Se distinguen contradicciones sustanciales —las que afectan el núcleo del hecho imputado: ' +
      'qué ocurrió, cuándo, cómo, dónde— de las periféricas, que no lo afectan y son admisibles ' +
      'por el paso del tiempo. Las sustanciales no se subsanan con la invocación de trauma.',
    articulos_cpp: ['CPP PBA Art. 209', 'CPP PBA Art. 210'],
    nivel_autoridad: 'orientativo',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'Contradicción en el testimonio de cargo distinción entre sustancial y periférica. ' +
      'Las contradicciones en el núcleo del hecho entre denuncia, IPP, cámara Gesell y juicio oral ' +
      'impiden fundar condena. Las contradicciones sobre el qué ocurrió, cuándo, cómo y dónde ' +
      'son sustanciales y no se subsanan invocando trauma.',
  },

  // ─────────────────────────────────────────────────────────────────
  // PERSPECTIVA DE GÉNERO — LÍMITES CONSTITUCIONALES
  // ─────────────────────────────────────────────────────────────────

  {
    id: 'PN-PG-001',
    instituto: 'perspectiva_genero',
    subtipo: 'limites_constitucionales',
    criterio: 'Perspectiva de género — límites constitucionales en el proceso penal',
    regla_general:
      'La perspectiva de género como criterio hermenéutico es constitucionalmente legítima, ' +
      'pero no puede: (a) reemplazar la presunción de inocencia; ' +
      '(b) invertir la carga de la prueba; ' +
      '(c) excluir la aplicación del in dubio pro reo; ' +
      '(d) presumir culpabilidad por el género del imputado; ' +
      '(e) condenar con prueba insuficiente. ' +
      'Cuando se aplica para estos fines, la resolución es nula por violación de garantías constitucionales. ' +
      'La perspectiva de género no puede reemplazar la acreditación objetiva del hecho.',
    articulos_cpp: ['CN Art. 18', 'CADH Art. 8', 'Convención de Belém do Pará Art. 7', 'CEDAW'],
    nivel_autoridad: 'vinculante',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'Perspectiva de género límites constitucionales en el proceso penal. ' +
      'No puede invertir la carga de la prueba, reemplazar la presunción de inocencia, ' +
      'excluir el in dubio pro reo, presumir culpabilidad por género del imputado, ' +
      'ni condenar con prueba insuficiente. La perspectiva de género no reemplaza la prueba del hecho.',
  },

  {
    id: 'PN-PG-002',
    instituto: 'perspectiva_genero',
    subtipo: 'aplicacion_valida',
    criterio: 'Perspectiva de género — aplicación válida en el proceso penal',
    regla_general:
      'La perspectiva de género se aplica válidamente para: ' +
      'contextualizar el marco de poder en que ocurrieron los hechos; ' +
      'evaluar la credibilidad del relato considerando reacciones propias de víctimas de violencia; ' +
      'evitar estereotipos que descalifiquen el testimonio sin fundamento objetivo; ' +
      'interpretar demoras en la denuncia cuando existe relación de dependencia. ' +
      'Su aplicación válida no altera los estándares probatorios ni la exigencia de certeza para condenar.',
    articulos_cpp: ['Convención de Belém do Pará', 'CEDAW', 'Ley 27.499'],
    nivel_autoridad: 'orientativo',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'Perspectiva de género aplicación válida en el proceso penal. ' +
      'Contextualizar el poder, evaluar credibilidad sin estereotipos, ' +
      'interpretar demoras por relación de dependencia. ' +
      'No altera los estándares probatorios ni la exigencia de certeza para condenar.',
  },

  // ─────────────────────────────────────────────────────────────────
  // CP ART. 119 — ELEMENTOS DEL TIPO
  // ─────────────────────────────────────────────────────────────────

  {
    id: 'PN-119-001',
    instituto: 'tipo_penal',
    subtipo: 'abuso_sexual',
    criterio: 'CP Art. 119 — elementos del tipo objetivo del abuso sexual',
    regla_general:
      'Para la consumación del tipo de abuso sexual (CP Art. 119, 1° párr.) deben acreditarse: ' +
      '(a) un hecho de naturaleza sexual; ' +
      '(b) realizado mediando violencia, amenaza, abuso coactivo o intimidatorio de una relación ' +
      'de dependencia, de autoridad o de poder, o prevaleciendo de cualquier causa que impida ' +
      'o limite el libre consentimiento; ' +
      '(c) ausencia de consentimiento libre y válido de la víctima. ' +
      'La acreditación de cada elemento recae exclusivamente en la acusación.',
    articulos_cpp: ['CP Art. 119 1er párrafo', 'CN Art. 18'],
    nivel_autoridad: 'vinculante',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'CP Artículo 119 elementos del tipo objetivo del abuso sexual. ' +
      'Acción de naturaleza sexual, mediando violencia o abuso de poder, ' +
      'y ausencia de consentimiento libre y válido. ' +
      'Cada elemento debe ser probado por la acusación independientemente.',
  },

  {
    id: 'PN-119-002',
    instituto: 'tipo_penal',
    subtipo: 'abuso_sexual',
    criterio: 'CP Art. 119 3° párr. — agravante acceso carnal, elemento autónomo',
    regla_general:
      'El acceso carnal (CP Art. 119, 3° párr.) requiere la acreditación de la introducción ' +
      'del miembro viril por vía anal, vaginal u oral, o de objetos o partes del cuerpo por ' +
      'las dos primeras vías. Es un elemento típico autónomo que debe probarse independientemente. ' +
      'La sola denuncia no acredita el acceso carnal. ' +
      'La prueba insuficiente de este elemento impone la tipificación en el párrafo base (menor pena), ' +
      'no en la figura agravada.',
    articulos_cpp: ['CP Art. 119 3er párrafo', 'CN Art. 18'],
    nivel_autoridad: 'vinculante',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'CP Artículo 119 tercer párrafo agravante acceso carnal elemento autónomo. ' +
      'Requiere acreditación específica de la introducción del miembro viril u objetos. ' +
      'La sola denuncia no acredita el acceso carnal. ' +
      'Prueba insuficiente impone tipificación en el párrafo base.',
  },

  // ─────────────────────────────────────────────────────────────────
  // NULIDADES PROCESALES
  // ─────────────────────────────────────────────────────────────────

  {
    id: 'PN-NUL-001',
    instituto: 'nulidades_procesales',
    subtipo: 'prueba_ilicita',
    criterio: 'Prueba ilícita — fruto del árbol envenenado',
    regla_general:
      'Las pruebas obtenidas en violación de garantías constitucionales son nulas de pleno derecho ' +
      'y no pueden ser valoradas (doctrina del fruto del árbol envenenado). ' +
      'La nulidad se extiende a todas las pruebas derivadas de la prueba ilícita, ' +
      'salvo que su obtención hubiera sido igualmente posible por una fuente independiente. ' +
      'Los allanamientos sin orden judicial válida, las interceptaciones sin autorización, ' +
      'y las pericias sobre material obtenido ilegalmente caen bajo esta regla.',
    articulos_cpp: ['CPP PBA Art. 60', 'CPP PBA Art. 228', 'CN Art. 18'],
    nivel_autoridad: 'vinculante',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'Prueba ilícita fruto del árbol envenenado nulidad de pleno derecho. ' +
      'Las pruebas obtenidas en violación de garantías constitucionales no pueden valorarse. ' +
      'La nulidad se extiende a las pruebas derivadas. ' +
      'Allanamientos sin orden, interceptaciones sin autorización, pericias sobre material ilegal.',
  },

  {
    id: 'PN-NUL-002',
    instituto: 'nulidades_procesales',
    subtipo: 'intimacion_hechos',
    criterio: 'Nulidad de la intimación de hechos — requisitos de validez',
    regla_general:
      'La nulidad del acto de intimación de hechos (art. 308 CPP PBA) procede cuando: ' +
      '(a) no se describieron circunstanciadamente los hechos imputados; ' +
      '(b) no se informó el derecho a guardar silencio y sus alcances; ' +
      '(c) no se permitió la asistencia del defensor de confianza; ' +
      '(d) el acto se realizó bajo coacción, engaño o promesa. ' +
      'La nulidad de la intimación acarrea la de todos los actos consecutivos dependientes, ' +
      'incluyendo la declaración del imputado prestada en esas condiciones.',
    articulos_cpp: ['CPP PBA Art. 308', 'CPP PBA Art. 60', 'CN Art. 18', 'CADH Art. 8.2'],
    nivel_autoridad: 'vinculante',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'Nulidad de la intimación de hechos requisitos de validez CPP PBA artículo 308. ' +
      'Descripción circunstanciada de los hechos, derecho a guardar silencio, ' +
      'asistencia del defensor de confianza, ausencia de coacción o engaño. ' +
      'La nulidad se extiende a los actos dependientes.',
  },

  {
    id: 'PN-NUL-003',
    instituto: 'nulidades_procesales',
    subtipo: 'derecho_defensa',
    criterio: 'Nulidad por violación del derecho de defensa en juicio',
    regla_general:
      'Son nulos los actos procesales que impidan al imputado ejercer su defensa material: ' +
      'alegar sobre los hechos imputados, ofrecer y producir prueba de descargo, ' +
      'controlar e interrogar la prueba de cargo, e interponer recursos. ' +
      'La indefensión en cualquier etapa invalida lo actuado a partir del vicio. ' +
      'No se exige demostración de perjuicio efectivo: la sola posibilidad de indefensión basta.',
    articulos_cpp: ['CPP PBA Art. 60', 'CPP PBA Art. 98', 'CN Art. 18', 'CADH Art. 8.2.c-f'],
    nivel_autoridad: 'vinculante',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'Nulidad por violación del derecho de defensa en juicio durante el proceso penal. ' +
      'Impedimento para alegar, ofrecer prueba, controlar prueba de cargo o recurrir. ' +
      'La indefensión en cualquier etapa invalida lo actuado. ' +
      'No se requiere perjuicio efectivo demostrado.',
  },

  // ─────────────────────────────────────────────────────────────────
  // VALORACIÓN DE LA PRUEBA
  // ─────────────────────────────────────────────────────────────────

  {
    id: 'PN-VP-001',
    instituto: 'valoracion_prueba',
    subtipo: 'sana_critica',
    criterio: 'Valoración de la prueba — sana crítica racional',
    regla_general:
      'Las pruebas deben valorarse individualmente y en su conjunto conforme a las reglas ' +
      'de la sana crítica racional: lógica formal, experiencia común y ciencias auxiliares. ' +
      'No existe tarifa legal de pruebas: ningún medio de prueba tiene valor predeterminado. ' +
      'Toda valoración debe ser fundada, explícita, reproducible y controlable por vía recursiva. ' +
      'La sentencia que no explicita el proceso de valoración carece de fundamentación suficiente.',
    articulos_cpp: ['CPP PBA Art. 210', 'CPP PBA Art. 371'],
    nivel_autoridad: 'vinculante',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'Valoración de la prueba sana crítica racional en el proceso penal. ' +
      'Lógica, experiencia común y ciencias auxiliares. Sin tarifa legal de pruebas. ' +
      'La valoración debe ser fundada, explícita y controlable. ' +
      'Sentencia sin fundamentación del proceso valorativo es nula.',
  },

  {
    id: 'PN-VP-002',
    instituto: 'valoracion_prueba',
    subtipo: 'cadena_custodia',
    criterio: 'Cadena de custodia — ruptura como duda razonable sobre la prueba de cargo',
    regla_general:
      'La ruptura de la cadena de custodia de elementos probatorios genera duda razonable ' +
      'sobre la autenticidad e integridad de esa prueba. ' +
      'El Ministerio Público debe acreditar la continuidad de la custodia desde la obtención ' +
      'hasta su incorporación en el debate. ' +
      'La duda sobre si la prueba fue alterada, sustituida o contaminada beneficia al imputado ' +
      'y excluye su valoración como prueba de cargo.',
    articulos_cpp: ['CPP PBA Art. 214', 'CPP PBA Art. 215', 'CPP PBA Art. 1'],
    nivel_autoridad: 'orientativo',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'Cadena de custodia ruptura genera duda razonable sobre la prueba de cargo. ' +
      'El Ministerio Público debe acreditar la continuidad de custodia de la evidencia. ' +
      'La duda sobre alteración o contaminación de la prueba excluye su valoración.',
  },

  // ─────────────────────────────────────────────────────────────────
  // PERICIAS FORENSES
  // ─────────────────────────────────────────────────────────────────

  {
    id: 'PN-PER-001',
    instituto: 'pericia_forense',
    subtipo: 'pericia_psicologica',
    criterio: 'Pericia psicológica forense — valor probatorio y límites',
    regla_general:
      'La pericia psicológica forense acredita indicadores de compatibilidad con una situación ' +
      'traumática o abusiva, no la ocurrencia del hecho. ' +
      'No puede reemplazar la prueba del hecho ni sustraer al juez la valoración de la credibilidad ' +
      'del testimonio. El perito dictamina sobre el estado psíquico del evaluado; ' +
      'la acreditación del hecho es una cuestión judicial, no pericial. ' +
      'Los indicadores de compatibilidad son corroboración periférica, no prueba directa.',
    articulos_cpp: ['CPP PBA Art. 249', 'CPP PBA Art. 250', 'CPP PBA Art. 254'],
    nivel_autoridad: 'orientativo',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'Pericia psicológica forense valor probatorio y límites en abuso sexual. ' +
      'Acredita indicadores de compatibilidad con trauma, no la ocurrencia del hecho. ' +
      'No puede reemplazar la prueba del hecho ni la valoración judicial de credibilidad. ' +
      'Los indicadores de compatibilidad son corroboración periférica, no prueba directa.',
  },

  {
    id: 'PN-PER-002',
    instituto: 'pericia_forense',
    subtipo: 'pericia_medica',
    criterio: 'Pericia médica — valor y límites en delitos contra la integridad sexual',
    regla_general:
      'La ausencia de lesiones físicas no excluye el abuso sexual sin acceso carnal, ' +
      'que raramente deja rastros físicos objetivos. ' +
      'Pero la sola mención de lesiones inespecíficas no acredita el abuso. ' +
      'El perito médico debe indicar con precisión científica el valor diagnóstico de sus hallazgos ' +
      'y distinguir entre hallazgos compatibles con el hecho, hallazgos inespecíficos, ' +
      'y ausencia de hallazgos. La ambigüedad pericial no favorece a la acusación.',
    articulos_cpp: ['CPP PBA Art. 249', 'CPP PBA Art. 250', 'CP Art. 119'],
    nivel_autoridad: 'orientativo',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'Pericia médica valor y límites en delitos contra la integridad sexual abuso. ' +
      'La ausencia de lesiones no excluye el abuso. Las lesiones inespecíficas no lo acreditan. ' +
      'El perito debe distinguir hallazgos compatibles de inespecíficos. ' +
      'La ambigüedad pericial no favorece a la acusación.',
  },

  {
    id: 'PN-PER-003',
    instituto: 'pericia_forense',
    subtipo: 'informe_terapeutico',
    criterio: 'Informe terapéutico — no equivale a pericia forense',
    regla_general:
      'El informe del terapeuta tratante no equivale a pericia forense porque: ' +
      'carece de metodología de evaluación forense neutral; ' +
      'tiene un vínculo de confianza con el paciente que compromete la objetividad; ' +
      'parte de la veracidad del relato del paciente como premisa terapéutica. ' +
      'Solo puede utilizarse como corroboración periférica del estado emocional, ' +
      'no como prueba de la ocurrencia del hecho imputado.',
    articulos_cpp: ['CPP PBA Art. 249', 'CPP PBA Art. 254'],
    nivel_autoridad: 'orientativo',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'Informe terapéutico del tratante no equivale a pericia forense en abuso sexual. ' +
      'Carece de metodología neutral forense y parte de la veracidad como premisa. ' +
      'Solo puede usarse como corroboración periférica del estado emocional, ' +
      'no como prueba de ocurrencia del hecho.',
  },

  // ─────────────────────────────────────────────────────────────────
  // PRISIÓN PREVENTIVA
  // ─────────────────────────────────────────────────────────────────

  {
    id: 'PN-PP-001',
    instituto: 'medidas_cautelares',
    subtipo: 'prision_preventiva',
    criterio: 'Prisión preventiva — requisitos de procedencia',
    regla_general:
      'La prisión preventiva es excepcional y requiere concurrencia de: ' +
      '(a) elementos de convicción suficientes sobre la participación del imputado en el hecho; ' +
      '(b) peligro de fuga concreto y actual —valorado conforme al art. 148 CPP PBA—, ' +
      'o peligro de entorpecimiento de la investigación concreto y específico. ' +
      'No puede sustentarse en la gravedad del hecho en abstracto, ' +
      'ni en la presunción de peligro sin base fáctica individualizada.',
    articulos_cpp: ['CPP PBA Art. 146', 'CPP PBA Art. 148', 'CPP PBA Art. 171', 'CADH Art. 7', 'CN Art. 18'],
    nivel_autoridad: 'vinculante',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'Prisión preventiva requisitos de procedencia en proceso penal PBA. ' +
      'Requiere elementos de convicción suficientes y peligro concreto de fuga o entorpecimiento. ' +
      'No puede fundarse en gravedad del hecho en abstracto ni presunción sin base fáctica.',
  },

  {
    id: 'PN-PP-002',
    instituto: 'medidas_cautelares',
    subtipo: 'prision_preventiva',
    criterio: 'Prisión preventiva — plazo razonable y pena anticipada inconstitucional',
    regla_general:
      'La prisión preventiva que excede el plazo razonable viola el derecho a la libertad ' +
      'y constituye pena anticipada inconstitucional. ' +
      'Para evaluar la razonabilidad del plazo se considera: complejidad del caso, ' +
      'conducta del imputado, conducta de las autoridades, y afectación de los derechos del imputado. ' +
      'La prolongación injustificada debe computarse como pena cumplida.',
    articulos_cpp: ['CPP PBA Art. 168', 'CADH Art. 7.5', 'PIDCyP Art. 9.3', 'CN Art. 18'],
    nivel_autoridad: 'vinculante',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'Prisión preventiva plazo razonable pena anticipada inconstitucional. ' +
      'La detención que excede el plazo razonable viola el derecho a la libertad. ' +
      'Se evalúa complejidad, conducta del imputado y conducta de las autoridades. ' +
      'La prolongación injustificada debe computarse como pena cumplida.',
  },

  // ─────────────────────────────────────────────────────────────────
  // GARANTÍAS PROCESALES ESPECÍFICAS
  // ─────────────────────────────────────────────────────────────────

  {
    id: 'PN-NSI-001',
    instituto: 'garantias_procesales',
    subtipo: 'non_bis_in_idem',
    criterio: 'Non bis in idem — prohibición de doble persecución penal',
    regla_general:
      'Nadie puede ser procesado ni condenado dos veces por el mismo hecho punible. ' +
      'La garantía opera desde el primer procesamiento formal y protege contra nueva persecución ' +
      'por el mismo hecho, aunque se encuadre bajo diferente calificación jurídica. ' +
      'La identidad del hecho se determina por el sustrato fáctico, no por la norma aplicada.',
    articulos_cpp: ['CPP PBA Art. 2', 'CN Art. 18', 'CADH Art. 8.4', 'PIDCyP Art. 14.7'],
    nivel_autoridad: 'vinculante',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'Non bis in idem prohibición de doble persecución penal por el mismo hecho. ' +
      'Nadie puede ser procesado ni condenado dos veces por el mismo hecho. ' +
      'Opera desde el primer procesamiento formal. ' +
      'La identidad del hecho se determina por el sustrato fáctico.',
  },

  {
    id: 'PN-DC-001',
    instituto: 'garantias_procesales',
    subtipo: 'doble_conforme',
    criterio: 'Doble conforme — revisión amplia de la condena por tribunal superior',
    regla_general:
      'El condenado tiene derecho a que la sentencia sea revisada ampliamente por un tribunal superior, ' +
      'en todos sus aspectos: fácticos, probatorios, jurídicos y de pena. ' +
      'La revisión no puede limitarse a errores in iudicando de derecho: ' +
      'debe extenderse a la valoración de la prueba. ' +
      'El incumplimiento de la doble instancia efectiva viola el Art. 8.2.h CADH y ' +
      'el Art. 14.5 del PIDCyP según interpretación del Comité de Derechos Humanos.',
    articulos_cpp: ['CADH Art. 8.2.h', 'PIDCyP Art. 14.5', 'CN Art. 75 inc. 22'],
    nivel_autoridad: 'vinculante',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'Doble conforme revisión amplia de la condena por tribunal superior. ' +
      'El condenado tiene derecho a revisión fáctica, probatoria, jurídica y de pena. ' +
      'No puede limitarse a errores de derecho. ' +
      'La revisión debe alcanzar la valoración de la prueba.',
  },

  {
    id: 'PN-SIL-001',
    instituto: 'garantias_procesales',
    subtipo: 'derecho_silencio',
    criterio: 'Derecho a guardar silencio — el silencio no puede valorarse en contra',
    regla_general:
      'El imputado tiene derecho a negarse a declarar sin que el silencio pueda ser ' +
      'interpretado en su contra como presunción de culpabilidad ni como indicio adverso. ' +
      'La declaración del imputado es un medio de defensa, no un acto probatorio a cargo. ' +
      'Ninguna consecuencia desfavorable puede derivarse del ejercicio de este derecho.',
    articulos_cpp: ['CPP PBA Art. 308', 'CN Art. 18', 'CADH Art. 8.2.g', 'PIDCyP Art. 14.3.g'],
    nivel_autoridad: 'vinculante',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'Derecho a guardar silencio el silencio no puede valorarse en contra del imputado. ' +
      'El imputado puede negarse a declarar sin consecuencias desfavorables. ' +
      'La declaración es medio de defensa no prueba de cargo. ' +
      'No puede derivarse indicio adverso del silencio.',
  },

  // ─────────────────────────────────────────────────────────────────
  // MOTIVACIÓN ESPURIA Y PRUEBA DE REFERENCIA
  // ─────────────────────────────────────────────────────────────────

  {
    id: 'PN-ME-001',
    instituto: 'valoracion_prueba',
    subtipo: 'motivacion_espuria',
    criterio: 'Motivación espuria — factor de valoración crítica del testimonio',
    regla_general:
      'La existencia de motivación espuria acreditada —interés económico, litigio de guarda, ' +
      'disputa por alimentos, régimen de visitas, venganza personal, presión de terceros— ' +
      'no invalida automáticamente el testimonio pero constituye un factor de valoración crítica ' +
      'que el tribunal debe examinar explícitamente. ' +
      'Cuando la motivación espuria se suma a contradicciones o falta de corroboración, ' +
      'la duda razonable es ineludible.',
    articulos_cpp: ['CPP PBA Art. 209', 'CPP PBA Art. 210'],
    nivel_autoridad: 'orientativo',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'Motivación espuria factor de valoración crítica del testimonio de cargo. ' +
      'Interés económico, litigio de guarda, alimentos, régimen de visitas, venganza. ' +
      'No invalida automáticamente pero exige examen explícito. ' +
      'Sumada a contradicciones o falta de corroboración, activa la duda razonable.',
  },

  {
    id: 'PN-PR-001',
    instituto: 'valoracion_prueba',
    subtipo: 'prueba_referencia',
    criterio: 'Testigo de oídas — valor probatorio limitado y corroborante',
    regla_general:
      'El testimonio de referencia —testigo que relata lo que le dijo la denunciante— ' +
      'tiene valor probatorio limitado: sirve para acreditar la consistencia del relato ' +
      'y la oportunidad de la denuncia, pero no constituye corroboración objetiva independiente ' +
      'del hecho imputado. ' +
      'No puede reemplazar a la corroboración periférica ni equivaler a prueba directa. ' +
      'La coincidencia entre el relato de referencia y el de la denunciante no suma prueba ' +
      'nueva si proviene de la misma fuente.',
    articulos_cpp: ['CPP PBA Art. 208', 'CPP PBA Art. 209'],
    nivel_autoridad: 'orientativo',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'Testigo de oídas valor probatorio limitado y corroborante en proceso penal. ' +
      'Relata lo que le dijo la denunciante. Sirve para consistencia del relato. ' +
      'No es corroboración objetiva independiente del hecho. ' +
      'No puede reemplazar la prueba directa ni equivaler a corroboración periférica.',
  },

  // ─────────────────────────────────────────────────────────────────
  // INVESTIGACIÓN PENAL PREPARATORIA
  // ─────────────────────────────────────────────────────────────────

  {
    id: 'PN-IPP-001',
    instituto: 'etapas_procesales',
    subtipo: 'investigacion_preparatoria',
    criterio: 'Plazo de la IPP — razonabilidad y derecho al sobreseimiento',
    regla_general:
      'La investigación penal preparatoria tiene plazos legales cuyo vencimiento sin ' +
      'elevación a juicio puede dar lugar a la petición de sobreseimiento ' +
      'por exceso en el plazo razonable de la investigación. ' +
      'El plazo razonable se evalúa conforme a la complejidad del caso y la conducta de las partes. ' +
      'La dilación exclusivamente imputable al Ministerio Público no puede perjudicar al imputado.',
    articulos_cpp: ['CPP PBA Art. 283', 'CPP PBA Art. 284', 'CPP PBA Art. 323', 'CADH Art. 8.1'],
    nivel_autoridad: 'vinculante',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'Plazo de la investigación penal preparatoria IPP razonabilidad y sobreseimiento. ' +
      'El vencimiento de plazos sin elevación a juicio habilita petición de sobreseimiento. ' +
      'La dilación del Ministerio Público no puede perjudicar al imputado.',
  },

  {
    id: 'PN-IPP-002',
    instituto: 'etapas_procesales',
    subtipo: 'sobreseimiento',
    criterio: 'Sobreseimiento — causales y efectos de cosa juzgada',
    regla_general:
      'El sobreseimiento es la resolución que cierra definitivamente el proceso ' +
      'cuando concurre alguna de las causales del CPP PBA Art. 323: ' +
      'el hecho no existió, no constituye delito, el imputado no participó, ' +
      'la acción penal se extinguió, o existe alguna causa de justificación o inculpabilidad. ' +
      'El sobreseimiento firme produce efectos de cosa juzgada material y activa la garantía del non bis in idem.',
    articulos_cpp: ['CPP PBA Art. 323', 'CPP PBA Art. 326', 'CPP PBA Art. 2'],
    nivel_autoridad: 'vinculante',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'Sobreseimiento causales y efectos de cosa juzgada en proceso penal PBA. ' +
      'Cierre definitivo del proceso cuando el hecho no existió, no es delito, ' +
      'el imputado no participó, o hay causas de extinción o inculpabilidad. ' +
      'El sobreseimiento firme produce cosa juzgada y activa el non bis in idem.',
  },

  {
    id: 'PN-ABS-001',
    instituto: 'etapas_procesales',
    subtipo: 'juicio_oral',
    criterio: 'Absolución por insuficiencia probatoria — fundamento en in dubio pro reo',
    regla_general:
      'La absolución por insuficiencia probatoria es la consecuencia directa e ineludible ' +
      'de la aplicación del principio in dubio pro reo cuando la acusación no logró destruir ' +
      'la presunción de inocencia más allá de toda duda razonable. ' +
      'No es una resolución favorable al imputado: es la consecuencia natural del fracaso ' +
      'de la acusación en su carga probatoria. ' +
      'El juez que absuelve por duda razonable no "favorece" al imputado: aplica la ley.',
    articulos_cpp: ['CPP PBA Art. 1', 'CPP PBA Art. 368', 'CN Art. 18', 'CADH Art. 8.2'],
    nivel_autoridad: 'vinculante',
    alcance: 'criterios_generales',
    jurisdiccion: 'argentina_pba',
    contenido:
      'Absolución por insuficiencia probatoria fundamento en in dubio pro reo. ' +
      'Consecuencia de que la acusación no destruyó la presunción de inocencia. ' +
      'El juez que absuelve por duda razonable aplica la ley, no favorece al imputado.',
  },

]
