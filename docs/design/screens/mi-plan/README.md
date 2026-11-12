# Mi plan · Reservo / Kinaf

Mockups mobile-first de la pestaña **Mi plan** del portal del cliente: el plan activo, lo que queda en la semana y cuándo se renueva el mes (PRD, sección 3). Es una pestaña, no una página interna: muestra el avatar y la barra de navegación, con Mi plan activo.

Misma semana, persona y reservas que Reservar: lunes 9 a domingo 15, hoy es miércoles 11, Sofi tiene Pilates el lunes (ya pasó) y Yoga hoy a las 19:00.

Toda la pantalla es información: no hay botones ni chips de estado. La tarjeta del plan es navy y no tiene chevron (no se abre). Lo reservado, lo libre y la recuperación son líneas con ícono, igual que en Detalle de clase. La barra de progreso usa segmentos llenos (reservada) y con borde (libre); el número siempre está en palabras arriba.

## Inventario de estados

| Archivo | Estado |
|---|---|
| `active.html` | Plan de 3 clases por semana, cualquier actividad. Le queda 1 de 3. |
| `specific.html` | Plan con actividades específicas, "2 Pilates + 1 Yoga": cupo por actividad. |
| `week-full.html` | Ya reservó las 3 clases de la semana; vuelven el lunes 16. |
| `recovery.html` | Tiene 1 clase de recuperación por una ausencia, válida hasta fin del mes de facturación. |
| `no-plan.html` | Sin plan activo: explicación y un único botón, Escribir a Kinaf por WhatsApp, anclado sobre la barra. |

## Fuera de alcance (pendiente de definición en el PRD)

- Cambio de plan desde la app: el PRD no lo prevé para el cliente y cuándo aplica está abierto.
- Plan vencido o suspendido por falta de pago: el PRD solo define renovación automática mensual.
- Extras (por ejemplo, Rutina personalizada) y precio del plan: se ven en Pagos, si corresponde.

## Verificación

`render.mjs` genera PNG de 390×844 junto a cada HTML y copias de 412×915 en `gate/`. Falla si Nunito Sans no cargó. Estos mockups son la entrada del `ux-complexity-gate`.
