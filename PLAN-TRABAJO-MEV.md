# Plan de Trabajo — Integración MEV + Pipeline Alcance Legal Penal
**Basado en sesión de prueba real:** 05/06/2026  
**Estado general:** En progreso

---

## PRINCIPIO RECTOR — Doble validación de jurisprudencia

**Origen:** Caso Bargas — un abogado citó jurisprudencia temáticamente favorable que resultó tácticamente contraproducente al analizarla contra los hechos concretos de la causa.

**Regla:** Ninguna jurisprudencia se entrega al abogado sin haber sido validada en dos capas:

1. **Capa 1 — RAG contextualizado:** el embedding de búsqueda incluye los hechos específicos de la causa y el objetivo defensivo, no solo el tema jurídico. Filtra por analogía fáctica antes de llegar al LLM.
2. **Capa 2 — Validación LLM:** el modelo evalúa si los hechos determinantes del fallo recuperado son análogos a los de esta causa, o si existen diferencias que lo tornan inaplicable o de "doble filo".
3. **Capa 3 — Output:** cada jurisprudencia citada en el informe indica explícitamente por qué es aplicable a ESTA causa. Si tiene riesgo de doble filo, se advierte.

**Valor diferencial:** mientras otros sistemas devuelven jurisprudencia genérica, Alcance Legal Penal garantiza que cada precedente fue validado contra los hechos específicos del caso antes de ser recomendado. Esto es un argumento de venta central frente a cualquier chatbot jurídico genérico.

---

## PRIORIDAD 1 — CRÍTICA: Resolver conectividad MCP

**Problema (real, no era DNS):** El proyecto Supabase original (`bwwlgfgjxslbavhfuhia`) había sido creado con la cuenta `edgardolamas2000@gmail.com`, distinta de la cuenta actualmente en uso (`lamasedgardo2024@gmail.com`). El `ENOTFOUND` / los 403 no eran de red — la cuenta activa simplemente no tenía acceso a ese proyecto.

**Impacto:** Sin acceso al proyecto, el pipeline formal de 5 fases no corría vía MCP.

**Resolución (05/07/2026):** Se migró todo a un proyecto Supabase nuevo bajo la cuenta actual:
- Proyecto nuevo: `alcance-legal-penal` — ref `nclpzmyjjmglpjalmrri` (org "Criterio Termico", región sa-east-1)
- 6 migraciones aplicadas + fix de overload duplicado en `buscar_criterios` (nueva migración 008)
- 4 Edge Functions redeployadas (`analizar-caso`, `auditar-estrategia`, `redactar-escrito`, `mcp-server`)
- Corpus completo recargado: 95 criterios jurídicos con embeddings
- Secrets configurados: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `ALLOWED_ORIGIN`
- `.env.local`, `chrome-extension/sidepanel.js`, `CLAUDE.md` y `docs/descripcion_sistema.md` actualizados con la nueva URL
- Pipeline probado end-to-end con caso real → `success: true, status: approved`

**Pendiente:** actualizar variables de entorno en Vercel (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) y en la config local del MCP server (`~/.claude.json`).

**Estado:** ✅ Resuelto

---

## PRIORIDAD 2 — ALTA: Protocolo estándar de captura MEV

**Problema:** Hoy abrimos documentos sin un orden definido, lo que generó idas y vueltas y consumo innecesario de tokens.

**Impacto:** Sin un protocolo fijo, cada sesión MEV es imprevisible y costosa.

**Solución definida — Lista de captura estándar para ejecución penal:**
1. Receptoría / Oficio de Respuesta
2. Primer Despacho / Se Provee
3. Último ITC disponible
4. Última Resolución
5. Última Audiencia / Acta
6. Legajo de Apelación más reciente

**Opciones a evaluar:**
- [ ] **Opción A** — Documento de protocolo para el usuario (checklist manual)
- [ ] **Opción B** — Automatizar la detección de documentos clave por palabras clave en `get_page_text`
- [ ] **Opción C** — Implementar en la extensión un selector automático de documentos prioritarios

**Palabras clave útiles identificadas:** RESOLUCIÓN, REGIMEN LIBERTAD CONDICIONAL, LEGAJO DE APELACIÓN, AUDIENCIA - ACTA, INFORME TECNICO CRIMINOLOGICO, PRIMER DESPACHO, RECEPTORIA, PERICIA PSICOLOGICA

**Decisión tomada:** _pendiente_  
**Estado:** ⬜ Sin iniciar

---

## PRIORIDAD 3 — ALTA: Scroll nativo en extensión MEV Navigator

**Problema:** Cualquier scroll automatizado en la página de pasos procesales produce pantalla en blanco. La MEV usa ASP clásico que colapsa la tabla al detectar scroll externo.

**Impacto:** Documentos antiguos (frecuentemente los más importantes: sentencia, cómputo) no son alcanzables sin intervención manual del usuario.

**Opciones a evaluar antes de decidir:**
- [ ] **Opción A** — Scroll nativo via JavaScript dentro de `content.js` de la extensión (permisos nativos diferentes al browser automation)
- [ ] **Opción B** — Paginación: detectar si hay botón "siguiente página" o link de navegación en la tabla ASP y usarlo en vez de scroll
- [ ] **Opción C** — Extraer todos los links de documentos desde el HTML completo con `get_page_text` sin necesidad de scroll

**Nota:** La Opción C puede ser la más simple si `get_page_text` ya captura el HTML completo incluyendo los elementos fuera del viewport.

**Decisión tomada:** _pendiente_  
**Estado:** ⬜ Sin iniciar

---

## PRIORIDAD 4 — MEDIA: Gestión de popups en extensión

**Problema:** Los íconos de lapicera de algunos documentos abren popups que el browser bloquea por defecto.

**Impacto:** El usuario debe hacer el click manualmente cuando el popup es bloqueado.

**Opciones a evaluar:**
- [ ] **Opción A** — Configurar `manifest.json` para permitir popups del dominio `mev.scba.gov.ar`
- [ ] **Opción B** — Interceptar el click en `content.js` y navegar directamente a la URL del popup en vez de abrir una nueva ventana
- [ ] **Opción C** — Abrir el documento en el panel lateral en vez de en popup

**Decisión tomada:** _pendiente_  
**Estado:** ⬜ Sin iniciar

---

## PRIORIDAD 5 — MEDIA: Detección de sesión expirada

**Problema:** Si Claude navega via URL directa o la sesión expira, la MEV redirige al login sin aviso claro. Hoy perdimos una sesión por esto.

**Impacto:** Pérdida de contexto, necesidad de nuevo login, posible corrupción del flujo de captura.

**Regla operativa definida:**  
> El flujo siempre debe ser: login → búsqueda → click en resultado → navegación interna. **Nunca URL directa.**

**Opciones a evaluar:**
- [ ] **Opción A** — Detector en `content.js`: si detecta el formulario de login, envía mensaje al panel lateral para avisar al usuario
- [ ] **Opción B** — Documentar la regla en el protocolo de captura (solución manual, sin código)
- [ ] **Opción C** — Keep-alive: ping periódico a la sesión MEV para evitar que expire

**Decisión tomada:** _pendiente_  
**Estado:** ⬜ Sin iniciar

---

## PRIORIDAD 6 — MEDIA: Brief estructurado por expediente

**Problema:** Al retomar un expediente en nueva sesión, Claude necesita releer todo desde cero o el usuario sube los mismos PDFs repetidamente.

**Impacto:** Alto consumo de tokens en cada sesión de seguimiento.

**Template propuesto:**
```
EXPEDIENTE: [número] — [Nombre]
CONDENA: [años] años — [Tribunal] — [fecha] — [estado firmeza]
DELITO: [artículos CP]
DETENCIÓN: [fecha] — Vencimiento: [fecha]
UNIDAD: [SPB Unidad] — Pabellón [N]
SITUACIÓN ACTUAL: [última resolución + fecha]
DEFENSA: [nombre defensor]
OBSTÁCULO CENTRAL: [el principal argumento adverso]
PRÓXIMO PASO: [acción pendiente]
```

**Opciones a evaluar:**
- [ ] **Opción A** — Template manual: el usuario lo completa después de cada sesión
- [ ] **Opción B** — Generación automática: al final de cada sesión MEV, Claude genera el brief y lo guarda
- [ ] **Opción C** — El MCP server guarda el brief en Supabase asociado al número de expediente

**Decisión tomada:** _pendiente_  
**Estado:** ⬜ Sin iniciar

---

## PRIORIDAD 7 — BAJA: Protocolo de reducción de tokens

**Problema:** La sesión de hoy fue muy costosa. PDFs de 64 páginas y `get_page_text` repetido fueron los mayores consumidores.

**Medidas acordadas:**
- Conversaciones separadas por tarea (captura / análisis / redacción)
- Pre-procesar PDFs: subir solo páginas relevantes
- No resubir PDFs ya analizados — usar el brief en su lugar
- `get_page_text` una sola vez por página
- No intentar abrir videos de Teams desde el chat

**Estado:** ⬜ Sin iniciar (aplicar desde la próxima sesión MEV)

---

## EXPEDIENTE BARGAS — Pendientes específicos

> Datos del expediente de prueba. Resolver en próxima sesión con credenciales del defensor.

- [ ] Abrir Legajo de Apelación del **10/07/2025** (resolución Cámara 08/08/2025 — confirma denegatoria)
- [ ] Verificar si el Acta **19/09/2024** tiene grabación Teams (audiencia salidas transitorias)
- [ ] Confirmar si la víctima intervino formalmente (oficios 13/04/2023 y 28/08/2024)
- [ ] Obtener acceso con credenciales del **defensor** (no del condenado JAB1973) para desbloquear TOC 1

---

## NOTAS OPERATIVAS

- El usuario MEV JAB1973 es el **propio condenado** — acceso limitado al expediente de ejecución
- El defensor es **Dra. Julia Martínez (Defensa Oficial)** — tiene acceso amplio incluyendo TOC 1
- Campo "Estado" en MEV vacío en causas de ejecución es comportamiento normal — inferir del último paso procesal
- Links de video Teams extraídos: tres grabaciones MP4 en SharePoint SCBA (requieren credenciales institucionales)

---

_Documento generado: 05/06/2026 — Actualizar estado en cada sesión de trabajo._
