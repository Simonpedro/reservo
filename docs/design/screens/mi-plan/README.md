# Mi plan · Reservo / Kinaf

Mockups mobile-first de la pestaña **Mi plan** del portal del cliente: el plan activo, lo que queda en la semana y cuándo se renueva el mes (PRD, sección 3). Es una pestaña, no una página interna: muestra el avatar y la barra de navegación, con Mi plan activo.

Misma semana, persona y reservas que Reservar: lunes 9 a domingo 15, hoy es miércoles 11, Sofi tiene Pilates el lunes (ya pasó) y Yoga hoy a las 19:00.

Toda la pantalla es información: no hay tarjetas que se abran, ni chips, ni botones (salvo la única acción del estado sin plan). Las tres secciones (Tu plan, Esta semana, Este mes) tienen la misma estructura: título de sección y después líneas con ícono, iguales a las de Detalle de clase. El saldo de la semana usa el mismo banner que Reservar ("Te queda 1 de 3 clases"), con el mismo texto, para que el mismo dato se vea igual en las dos pestañas.

Se descartó, por el gate, una primera versión con la tarjeta del plan en navy con foto y una barra de progreso por segmentos: el navy relleno se leía como un botón primario y los segmentos como chips.

## Inventario de estados

| Archivo | Estado |
|---|---|
| `active.html` | Plan de 3 clases por semana, cualquier actividad. Le queda 1 de 3. |
| `specific.html` | Plan con actividades específicas, "2 Pilates + 1 Yoga": la clase libre dice de qué actividad es. |
| `week-full.html` | Ya reservó las 3 clases de la semana; vuelven el lunes 16. |
| `recovery.html` | Tiene 1 clase de recuperación por una ausencia, en Este mes: vence a fin del mes de facturación. |
| `no-plan.html` | Sin plan activo: explicación y un único botón, Escribir a Kinaf por WhatsApp, anclado sobre la barra. |

## Fuera de alcance (pendiente de definición en el PRD)

- Cambio de plan desde la app: el PRD no lo prevé para el cliente y cuándo aplica está abierto.
- Plan vencido o suspendido por falta de pago: el PRD solo define renovación automática mensual.
- Extras (por ejemplo, Rutina personalizada) y precio del plan: se ven en Pagos, si corresponde.

## Verificación

`render.mjs` genera PNG de 390×844 junto a cada HTML y copias de 412×915 en `gate/`. Falla si Nunito Sans no cargó. Estos mockups son la entrada del `ux-complexity-gate`.
