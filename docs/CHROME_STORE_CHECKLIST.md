# Chrome Web Store — Checklist de Publicación
## MEV Navigator · Alcance Legal Penal · v1.0.0

---

## PRE-PUBLICACIÓN

### Archivos de la extensión
- [ ] `manifest.json` validado sin errores (`npm run build:extension` sin errores)
- [ ] Los 3 íconos PNG existen y tienen el tamaño correcto
  - [ ] `chrome-extension/icons/icon16.png` (16×16 px)
  - [ ] `chrome-extension/icons/icon48.png` (48×48 px)
  - [ ] `chrome-extension/icons/icon128.png` (128×128 px)
- [ ] ZIP generado con `npm run build:extension`
  - Archivo: `alcance-legal-mev-navigator-v1.0.0.zip`
- [ ] ZIP verificado: descomprimir y comprobar que `manifest.json` está en la raíz
- [ ] No hay `node_modules/` ni archivos de desarrollo en el ZIP
- [ ] No hay API Keys hardcodeadas en ningún archivo del ZIP

### Assets de la Store
- [ ] Política de privacidad hosteada en URL pública accesible
  - URL sugerida: `https://edgardo-lamas.github.io/alcance-legal-penal/privacy-policy-extension`
  - Alternativa: `https://alcancelegal.com.ar/privacy-policy-extension`
  - Archivo fuente: `public/privacy-policy-extension.html`
- [ ] Screenshot 1 preparado: panel lateral con análisis (1280×800 px)
  - Ver instrucciones en `docs/store-assets/README.md`
- [ ] Screenshot 2 preparado: popup de la extensión (1280×800 px)
- [ ] Screenshot 3 preparado: datos de carátula extraídos (1280×800 px)

### Textos de la ficha
- [ ] **Descripción corta** (máx 132 chars):
  ```
  Copiloto de IA para abogados defensores. Analiza expedientes del MEV (SCBA) con inteligencia jurídica penal — CPP PBA.
  ```
  _(118 caracteres)_

- [ ] **Descripción larga** (copiar y pegar en la Store):

---

MEV Navigator es el copiloto de IA para abogados defensores que trabajan en causas penales bajo el CPP PBA (Ley 11.922).

Se integra directamente con la Mesa de Entradas Virtual de la Suprema Corte de Buenos Aires (mev.scba.gov.ar) y permite:

✓ Analizar expedientes penales con inteligencia artificial
✓ Detectar nulidades procesales y vicios del procedimiento
✓ Identificar garantías constitucionales aplicables al caso
✓ Evaluar la solidez de la prueba de cargo
✓ Generar informes defensivos estructurados en 5 fases
✓ Gestionar y descargar PDFs de las actuaciones del expediente

El análisis sigue la metodología de un asociado senior de defensa penal:
• FASE 1 — Encuadre procesal
• FASE 2 — Análisis de prueba de cargo
• FASE 3 — Nulidades y vicios procesales (arts. 201-210 CPP PBA)
• FASE 4 — Contraargumentación defensiva
• FASE 5 — Recomendación estratégica

Desarrollado sobre el sistema Alcance Legal Penal, especializado en defensa penal desde la perspectiva del in dubio pro reo y la presunción de inocencia.

PRIVACIDAD: Los datos del expediente nunca salen de tu dispositivo hacia servidores propios. Las llamadas a la IA se realizan directamente desde tu navegador a la API de Anthropic usando tu propia clave.

IMPORTANTE: Esta herramienta brinda información orientativa basada en criterios jurisprudenciales. No reemplaza el criterio profesional del abogado defensor.

© 2026 Edgardo Lamas — Studio Lamas

---

- [ ] **Categoría:** Productivity
- [ ] **Idioma principal:** Español (es-419 o es)
- [ ] **Región de distribución:** Worldwide (o Argentina si se prefiere)
- [ ] **Visibilidad:** Unlisted (beta privada)
- [ ] **Precio:** Gratis

---

## PUBLICACIÓN EN DEVELOPER DASHBOARD

### Cuenta de desarrollador
- [ ] Crear cuenta en https://chrome.google.com/webstore/devconsole
  - _(costo único: USD 5 — tarjeta de crédito)_
- [ ] Verificar email de la cuenta
- [ ] Completar perfil de desarrollador (nombre, sitio web)

### Subir la extensión
- [ ] Clic en "New Item" → subir `alcance-legal-mev-navigator-v1.0.0.zip`
- [ ] Esperar validación automática del ZIP (1-2 minutos)
- [ ] Verificar que no hay errores en el parser del manifest

### Completar la ficha
- [ ] Pegar descripción corta (118 chars)
- [ ] Pegar descripción larga (ver arriba)
- [ ] Subir screenshots (mínimo 1, recomendado los 3)
- [ ] Subir ícono de la tienda: `icon128.png` (o versión de mayor resolución si se tiene)
- [ ] Pegar URL de política de privacidad
- [ ] Seleccionar categoría: **Productivity**
- [ ] Seleccionar visibilidad: **Unlisted**

### Justificación de permisos (Google lo pide)
Completar el campo "Permission justification" con:

| Permiso | Justificación |
|---|---|
| `sidePanel` | Muestra el panel de análisis lateral en Chrome |
| `storage` | Guarda preferencias y historial de análisis localmente |
| `activeTab` | Lee el contenido de la pestaña activa del MEV para extraer datos del expediente |
| `scripting` | Inyecta el extractor de datos en páginas de mev.scba.gov.ar |
| Host: `mev.scba.gov.ar` | La extensión opera exclusivamente en este dominio judicial |

### Publicar
- [ ] Revisar todos los campos completados
- [ ] Clic en "Submit for review"
- [ ] Esperar revisión de Google: **1 a 3 días hábiles**

---

## POST-PUBLICACIÓN

### Distribución beta
- [ ] Copiar URL de instalación directa (unlisted):
  `https://chrome.google.com/webstore/detail/[EXTENSION-ID]`
- [ ] Compartir URL con abogados beta testers (máximo 20 para beta inicial)
- [ ] Crear grupo de WhatsApp/email para feedback de beta testers

### Monitoreo
- [ ] Revisar Developer Dashboard semanalmente (primeras 2 semanas)
- [ ] Responder reviews si las hay
- [ ] Monitorear errores reportados
- [ ] Verificar que la extensión funciona en Chrome actualizado

### Próxima versión (v1.1.0)
- [ ] Reemplazar API Key personal por autenticación con Supabase (login del abogado)
- [ ] Ajustar `content.js` según DOM real del MEV (post-prueba real)
- [ ] Agregar permiso `downloads` para mejorar descarga de PDFs con nombre descriptivo
- [ ] Actualizar versión en `manifest.json` y `sidepanel.html`
- [ ] Regenerar ZIP con `npm run build:extension`
- [ ] Subir nueva versión en Developer Dashboard

---

## DATOS DE LA EXTENSIÓN

| Campo | Valor |
|---|---|
| Nombre interno | `legal-intelligence-system` (package.json) |
| Nombre en Store | `MEV Navigator — Defensa Penal PBA` (sugerido) ó `Alcance Legal Penal — MEV Navigator` |
| Versión actual | `1.0.0` |
| Manifest version | MV3 |
| Host único | `mev.scba.gov.ar` |
| Permisos | sidePanel, storage, activeTab, scripting |
| Archivo ZIP | `alcance-legal-mev-navigator-v1.0.0.zip` |
| Política de privacidad | `public/privacy-policy-extension.html` |
| Screenshots | `docs/store-assets/` |
| Ícono fuente | `scripts/generate-extension-icons.js` (generado con sharp) |

---

## COMANDOS ÚTILES

```bash
# Generar íconos PNG
npm run build:icons

# Generar ZIP completo listo para la Store
npm run build:extension

# Verificar integridad del ZIP (compara SHA256)
shasum -a 256 alcance-legal-mev-navigator-v1.0.0.zip
```

---

_Checklist creado: 2026-04-07 · Alcance Legal Penal · Studio Lamas_
