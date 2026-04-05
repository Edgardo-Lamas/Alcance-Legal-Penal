# Alcance Legal Penal — MEV Navigator

Extensión de Chrome para navegar, extraer y analizar expedientes judiciales del MEV (Mesa de Entradas Virtual) de la SCBA con asistencia de IA.

---

## Requisitos

- Google Chrome 114 o superior
- API Key de Anthropic (claude.ai)

---

## Paso 1 — Obtener la API Key de Anthropic

1. Ingresá a [console.anthropic.com](https://console.anthropic.com)
2. Creá una cuenta o iniciá sesión
3. Ir a **API Keys** → **Create Key**
4. Copiá la key (empieza con `sk-ant-...`) — guardala en un lugar seguro, se muestra una sola vez

---

## Paso 2 — Generar los íconos

Antes de instalar la extensión necesitás generar los archivos de ícono:

1. Abrí el archivo `generate-icons.html` en Chrome
   - Podés arrastrarlo directamente a una pestaña de Chrome
2. Hacé clic en los tres botones: **icon16.png**, **icon48.png**, **icon128.png**
3. Guardá cada archivo descargado en la carpeta `chrome-extension/icons/`

---

## Paso 3 — Instalar la extensión en Chrome

1. Abrí Chrome y navegá a `chrome://extensions`
2. Activá el **Modo desarrollador** (toggle arriba a la derecha)
3. Hacé clic en **"Cargar desempaquetada"**
4. Seleccioná la carpeta `chrome-extension/` (esta carpeta)
5. La extensión aparecerá en la barra de herramientas con el ícono "ALP"

---

## Paso 4 — Configurar la extensión

1. Hacé clic en el ícono **ALP** en la barra de Chrome
2. Hacé clic en **"Abrir panel de análisis"**
3. En el panel lateral, ir a la pestaña **Config**
4. Pegá tu **API Key de Anthropic** en el campo correspondiente
5. Seleccioná el modelo (recomendado: `claude-sonnet-4-5`)
6. Hacé clic en **"Guardar configuración"**

---

## Paso 5 — Primer uso con el MEV

1. Navegá a [mev.scba.gov.ar](https://mev.scba.gov.ar) e iniciá sesión con tus credenciales
2. El panel lateral detectará automáticamente que estás en el MEV
3. Buscá y abrí una causa (fuero Penal requiere autorización previa del juzgado)
4. El panel mostrará los datos extraídos de la carátula y las actuaciones
5. Hacé clic en **"Analizar expediente con IA"**
6. En 15-30 segundos tendrás el análisis completo en 5 fases

---

## Funcionalidades

### Análisis automático en 5 fases
- **Fase 1** — Encuadre procesal
- **Fase 2** — Análisis de prueba de cargo
- **Fase 3** — Nulidades y vicios procesales
- **Fase 4** — Contraargumentación defensiva
- **Fase 5** — Recomendación estratégica

### Gestión de documentos
- Lista los PDFs disponibles en el expediente
- Selección automática de documentos prioritarios (acta de detención, indagatoria, auto de procesamiento, etc.)
- Descarga directa con nombre descriptivo

### Historial
- Guarda los últimos 20 análisis localmente en el navegador
- Permite revisar análisis anteriores sin volver al MEV

---

## Notas importantes

- **Privacidad**: la API Key y el historial se guardan únicamente en tu navegador (chrome.storage.local). Nunca se envían a servidores externos de Alcance Legal Penal.
- **Credenciales MEV**: la extensión NUNCA pide ni almacena tu usuario/contraseña del MEV. El login siempre lo hacés vos.
- **Expedientes penales**: el MEV requiere autorización previa del juzgado para acceder a causas penales y de familia.
- **Uso profesional**: los análisis son orientativos y no reemplazan el criterio profesional del abogado defensor.

---

## Solución de problemas

| Problema | Solución |
|---|---|
| La extensión no detecta el MEV | Verificá que estás en mev.scba.gov.ar y recargá la pestaña |
| "API Key inválida" | Verificá que copiaste la key completa (sk-ant-...) |
| No extrae datos de la causa | El MEV puede tener distintas estructuras según el fuero; usá el botón "Re-extraer" |
| PDF no descarga | Puede requerir que estés logueado. Hacé clic derecho → "Abrir enlace en nueva pestaña" |
| El panel no abre | Reiniciá Chrome o recargá la extensión en chrome://extensions |

---

© 2026 Edgardo Lamas — Studio Lamas. Todos los derechos reservados.  
Alcance Legal Penal · CPP PBA (Ley 11.922) · Defensa Penal · Buenos Aires
