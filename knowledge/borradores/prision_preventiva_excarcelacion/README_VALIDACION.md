# Lote borrador — Prisión Preventiva y Excarcelación (PENAL-PREV-001 a 014)

**Estado: BORRADOR — NO CARGAR SIN VALIDACIÓN DE ABOGADO/A**

Generado el 2026-07-07 para cubrir el punto más débil del corpus (prisión preventiva:
solo 2 criterios en producción). Esta carpeta está **fuera** del camino de carga
automática (`knowledge/jurisprudencia_publica/penal/`) a propósito: nada de acá
entra al sistema hasta que un profesional lo valide.

## Qué contiene

14 criterios con el esquema exacto del corpus (mismo formato que PENAL-NUL-007):

| ID | Tema |
|----|------|
| PREV-001 | Requisitos de procedencia y motivación autónoma |
| PREV-002 | Peligro de fuga — pautas objetivas |
| PREV-003 | Entorpecimiento — indicios concretos y actuales |
| PREV-004 | Gravedad del delito / alarma social — insuficiencia |
| PREV-005 | Delitos "no excarcelables" — inconstitucionalidad (Nápoli) |
| PREV-006 | Excarcelación ordinaria (art. 169, Ley 13.449) |
| PREV-007 | Excarcelación extraordinaria (art. 170) |
| PREV-008 | Denegatoria — motivación reforzada |
| PREV-009 | Proporcionalidad y subsidiariedad — alternativas de oficio |
| PREV-010 | Arraigo — evaluación integral y carga probatoria |
| PREV-011 | Plazo razonable — revisión periódica y cese (Bayarri) |
| PREV-012 | Cauciones — la menos gravosa; caución imposible = denegatoria encubierta |
| PREV-013 | Impugnación de la preventiva — apelación amplia |
| PREV-014 | Condiciones de detención — hábeas corpus correctivo (Verbitsky) |

Complementan (sin duplicar) los ya cargados: PENAL-GAR-010 (excepcionalidad),
PENAL-GAR-011 (morigeración/domiciliario) y PENAL-NUL-004 (exceso de plazo).

## ⚠️ Qué DEBE verificar el/la abogado/a antes de cargar

La doctrina general y los estándares interamericanos son sólidos. Los puntos a
confirmar contra el texto vigente del CPP PBA (Ley 11.922 y modificatorias) son:

1. **Números de artículo exactos** — verificar especialmente:
   - arts. **159 / 163** (alternativas y atenuación de la coerción) → PREV-009
   - art. **164** (recurribilidad de la preventiva) → PREV-013
   - art. **141** (duración) → PREV-011
   - arts. **177 y ss.** (régimen de cauciones: rango exacto) → PREV-012
   - arts. **169 / 170 / 171** texto según Ley 13.449 → PREV-005/006/007/008
2. **Citas de fallos**: confirmar "Loyo Fraire" (CSJN 2014) y su cita de Fallos;
   "Nápoli" Fallos 321:3630; "Verbitsky" Fallos 328:1146; "Bayarri vs. Argentina"
   (Corte IDH 2008). Agregar fallos SCBA específicos del fuero si se conocen
   (fortalece mucho el criterio ante jueces bonaerenses).
3. **Vigencia normativa**: reformas posteriores a la Ley 13.449 que hayan tocado
   el régimen excarcelatorio.
4. **nivel_autoridad**: revisar si "orientativo" / "vinculante" asignado a cada
   criterio refleja el estado real de la doctrina.

## Cómo cargar (después de validar)

```bash
# 1. Mover la carpeta validada al camino de carga:
mkdir -p knowledge/jurisprudencia_publica/penal/prision_preventiva
mv knowledge/borradores/prision_preventiva_excarcelacion/PENAL-PREV-*.json \
   knowledge/jurisprudencia_publica/penal/prision_preventiva/

# 2. Actualizar version y fecha_actualizacion en cada JSON (quitar "-borrador")

# 3. Cargar al corpus (genera embeddings — requiere OPENAI_API_KEY en .env.local):
node scripts/load-criterios.js
```

Tras la carga, verificar con una consulta de prueba vía MCP:
`buscar_jurisprudencia("excarcelación y peligro de fuga arraigo")`.
