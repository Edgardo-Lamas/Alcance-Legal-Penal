# Store Assets — MEV Navigator

Screenshots y assets requeridos para la ficha de Chrome Web Store.

---

## Requisitos de Google

| Asset | Dimensiones | Formato | Obligatorio |
|---|---|---|---|
| Ícono de la extensión | 128×128 px | PNG | ✅ (ya en manifest) |
| Screenshot principal | 1280×800 px ó 640×400 px | PNG o JPEG | ✅ Mínimo 1 |
| Screenshots adicionales | 1280×800 px ó 640×400 px | PNG o JPEG | Recomendado (hasta 5) |
| Imagen promocional pequeña | 440×280 px | PNG o JPEG | Opcional |
| Imagen promocional grande | 920×680 px | PNG o JPEG | Opcional |
| Video promo | URL YouTube | — | Opcional |

> Google rechaza screenshots con bordes, sombras o marcos de dispositivo agregados manualmente.
> Usar screenshots directos del navegador, sin decoraciones.

---

## Screenshots a capturar

### Screenshot 1 — Panel lateral con análisis completo (OBLIGATORIO)
**Nombre archivo:** `screenshot-01-analisis.png`
**Dimensiones:** 1280×800 px

**Configuración previa:**
1. Instalar la extensión en Chrome (modo desarrollador)
2. Ir a Configuración de Chrome → Más herramientas → Extensiones → MEV Navigator → Detalles
3. Activar "Anclado a la barra de herramientas"
4. Configurar una API Key válida de Anthropic en la pestaña Config del panel

**Pasos para capturar:**
1. Abrir Chrome con la ventana en **1280×800 px** exactos
   - Redimensionar con: Vista → Pantalla completa (OFF) → ajustar manualmente
   - O usar DevTools: F12 → ícono responsive → establecer 1280×800
2. Navegar a `mev.scba.gov.ar` e iniciar sesión
3. Abrir una causa penal con actuaciones visibles
4. Hacer clic en el ícono ALP → el panel lateral se abre a la derecha
5. Hacer clic en "Analizar expediente con IA"
6. Esperar el análisis completo (15-30s)
7. Expandir la Fase 1 del análisis para que sea visible
8. **Capturar con:** `Cmd+Shift+4` → seleccionar área exacta 1280×800
   - Alternativa: DevTools → ⋮ → Capture screenshot
9. Guardar como `screenshot-01-analisis.png` en esta carpeta

**Qué debe mostrar:**
- El MEV visible en el fondo (expediente real o demo)
- El panel lateral abierto a la derecha con el análisis
- La Fase 1 expandida mostrando texto del análisis
- El header con "Alcance Legal Penal | MEV Navigator" visible

---

### Screenshot 2 — Popup de la extensión
**Nombre archivo:** `screenshot-02-popup.png`
**Dimensiones:** 1280×800 px

**Pasos para capturar:**
1. Navegar a cualquier página (puede ser el MEV o una página en blanco)
2. Hacer clic en el ícono ALP en la barra de herramientas
3. El popup se abre (260px de ancho)
4. Capturar la pantalla completa (1280×800) con el popup visible
   - El popup debe estar centrado/visible en la imagen
5. Guardar como `screenshot-02-popup.png`

**Qué debe mostrar:**
- El popup con el monograma ALP, título y botón "Abrir panel de análisis"
- Fondo del navegador visible (MEV u otra página)

---

### Screenshot 3 — Panel con datos de carátula extraídos
**Nombre archivo:** `screenshot-03-caratula.png`
**Dimensiones:** 1280×800 px

**Pasos para capturar:**
1. Abrir el MEV con una causa penal abierta
2. Abrir el panel lateral (sin hacer el análisis aún)
3. El panel debe mostrar la sección "Causa detectada" con los datos de carátula
4. Verificar que se vean: carátula, número de expediente, organismo, etapa
5. Capturar 1280×800
6. Guardar como `screenshot-03-caratula.png`

**Qué debe mostrar:**
- Los datos extraídos automáticamente de la carátula
- Los botones "Analizar expediente con IA" y "Re-extraer datos"
- El status dot en verde con "Causa detectada ✓"

---

## Herramientas de captura recomendadas

### macOS (recomendado)
```bash
# Captura de área seleccionada con coordenadas exactas
Cmd+Shift+4

# Captura de ventana completa
Cmd+Shift+3

# Para 1280×800 exactos: usar la herramienta de Grab o screencapture
screencapture -R 0,0,1280,800 screenshot.png
```

### Chrome DevTools (más preciso)
```
1. F12 → abre DevTools
2. Clic en ícono "Toggle device toolbar" (Ctrl+Shift+M)
3. Establecer 1280 × 800 en los campos de dimensión
4. Clic en ⋮ (tres puntos) en DevTools
5. "Capture screenshot" o "Capture full size screenshot"
```

---

## Datos demo para screenshots (si no tenés MEV real)

Si no tenés acceso al MEV al momento de capturar, podés usar datos de demostración.
La extensión muestra la interfaz completa incluso sin datos reales cuando se fuerza
manualmente el estado en el panel.

**Carátula de ejemplo para demo:**
```
Carátula: PÉREZ, JUAN CARLOS S/ ROBO CALIFICADO
Expediente: 15-2847-2024
Fuero: Penal
Departamento: La Plata
Organismo: Tribunal en lo Criminal Nº 2
Etapa: Investigación Penal Preparatoria
Situación: Detenido — Prisión Preventiva vigente
```

---

## Checklist de screenshots

- [ ] `screenshot-01-analisis.png` — 1280×800 — análisis completado visible
- [ ] `screenshot-02-popup.png` — 1280×800 — popup de la extensión
- [ ] `screenshot-03-caratula.png` — 1280×800 — datos de carátula extraídos
- [ ] Verificar que ninguna screenshot contenga datos personales reales
- [ ] Verificar que no se vea la API Key en ninguna captura
- [ ] Redimensionar si es necesario: `sips -z 800 1280 screenshot.png` (macOS)

---

## Textos sugeridos para pie de screenshot (en la Store)

| Screenshot | Texto sugerido |
|---|---|
| 01 | "Análisis defensivo en 5 fases directamente en el expediente del MEV" |
| 02 | "Acceso rápido desde la barra de herramientas de Chrome" |
| 03 | "Extracción automática de carátula y actuaciones del expediente" |
