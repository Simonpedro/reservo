# ux-complexity-gate — prototipo completo

Fecha: 12 nov 2026. Umbrales sin cambios (skill `ux-complexity-gate`). Máximo 2 rondas.

## Veredicto: REVIEW (sin bloqueos)

| Capa | Resultado |
|---|---|
| A (DOM + axe, P1–P12, A1) — 390×844 y 412×915 | **PASS** — 56 estados, 0 bloqueos, 0 avisos (`report.json`) |
| A3 (toques por tarea) | **PASS** — 10/10 tareas dentro del presupuesto (`tasks-result.json`) |
| App (barra, profundidad, volver) | **PASS** — 3–4 destinos con etiqueta; profundidad máx. 3 (Ajustes › Planes › Plan); toda pantalla interna tiene volver; las hojas se cierran primero |
| V (visual, 3 corridas `composer-2.5`) | **REVIEW** — ronda 1: sólo S2. Ronda 2: sólo S2 con mayoría (ver abajo) |

## Ronda 1 → cambios aplicados

Etiquetas unificadas ("Elegir clase", "Registrar pago", "Guardar"); toggle elegido en celeste (no compite con el primario);
aviso de pendiente y botón juntos en el dock; detalle suspendido con "Elegir clase"; estado vacío sin fondo; comprobante simulado;
completos como lista informativa; historial de Pagos como líneas; contacto de Mi plan como botón secundario.
La tarea "cargar horario fijo" bajó de 7 a 5 toques (alerta → asignar directo, sin paso de plan si ya tiene, fecha en el último paso).

## Ronda 2 (final) — hallazgos con mayoría

- **P12 S2 (3/3) — avatar sin etiqueta** en las pantallas con barra (cliente, admin, instructor). Patrón aceptado del diseño Píldora; se deja en REVIEW.
- **admin-plan R3/P11 (2/3, una corrida S3 y otra S2)** — "Quitar cupo 2" sin marca: el elemento queda fuera del viewport de la captura, por eso no se numeró. Verificado scrolleando: es un link real y el dock no lo tapa. No llega a mayoría S3 → no bloquea.
- **admin-plan R5/R7/R10 S2** — pantalla densa (dos cupos con actividades) y actividades como toggles en vez de selects. Se mantiene: es selección múltiple; un select no sirve. A decidir por Simon si molesta.
- **mi-plan R10 S2 (una corrida S3)** — "Escribir a Kinaf" es secundario cuando hay otra cosa en pantalla y primario cuando es la única acción (sin plan / sin horario). Regla documentada en DESIGN.md; se deja en REVIEW.
- **admin-horario-cupo R9 S2** — "Guardar" no se ve deshabilitado cuando el aviso de cupo bloquea. Menor.

Resultados crudos: `visual/`, resumen: `visual-summary.json`.
