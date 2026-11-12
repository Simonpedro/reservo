# Reservar · Reservo / Kinaf

Mockups mobile-first de la pantalla de inicio del portal del cliente. Reservar concentra la agenda diaria, el saldo semanal del plan (solo si todavía queda alguna clase por reservar), la reserva y cancelación de clases, y las recuperaciones.

Todos los estados usan la misma semana (lunes 9 a domingo 15), la misma persona (Sofi) y el plan de 3 clases por semana, salvo donde se indica. En la tira, los días con una reserva ya hecha se distinguen del día seleccionado. La navegación inferior mantiene exactamente tres destinos: Reservar, Mi plan y Pagos; Perfil se abre desde el avatar.

La reserva se hace con un botón **Reservar** en la tarjeta, siempre con el mismo estilo, cuando esa acción está disponible. *Ya reservada*, *Cupo completo*, *No incluida en tu plan* y los lugares libres son una línea más de información, con ícono, junto al horario y el centro: no se ven como chips ni como botones. La agenda muestra todas las actividades; si una clase no forma parte del plan, se marca como no incluida y no se puede reservar. Si la clase ya está reservada y faltan 24 h o más, un menú de tres puntos en la esquina superior derecha de la tarjeta (Más acciones) permite **Cancelar reserva** y abre la hoja de confirmación. Si faltan menos de 24 h, no hay menú: el aviso manda a WhatsApp desde Perfil. Cada tarjeta indica horario, instructor, centro y estado o cupo.

## Inventario de estados

| Archivo | Estado |
|---|---|
| `list.html` | Miércoles por defecto: queda 1 de 3, Pilates con botón Reservar, Yoga ya reservada (menú de cancelar), Gimnasio completo y días con reserva marcados. |
| `two-available.html` | Queda 2 de 3: Pilates y Yoga se pueden reservar, ambas con el mismo botón Reservar; Gimnasio completo. |
| `success.html` | Acaba de reservar Pilates: confirmación reversible con Deshacer, sin banner semanal. |
| `cancel-menu.html` | Menú de tres puntos abierto en Yoga, con la acción Cancelar reserva. |
| `cancel-confirm.html` | Confirmación de cancelación en hoja inferior, con dos acciones. |
| `late-cancel.html` | Yoga a menos de 24 horas; aviso de contacto por WhatsApp desde Perfil, sin menú de cancelar. |
| `empty.html` | Domingo 15 sin clases; la tira semanal queda disponible para probar otro día. |
| `recovery.html` | Agenda por defecto con una clase de recuperación disponible durante el mes de facturación. |
| `week-full.html` | Ya reservó las 3 clases de la semana: sin banner de cupo semanal; cancelar queda en el menú de cada reserva. |
| `not-in-plan.html` | Plan de Yoga y Pilates: Gimnasio aparece en la lista, marcado como no incluida en tu plan y sin botón Reservar. |

`screen.css` contiene las medidas de producción y los ajustes de composición. `screen.js` comparte la estructura semántica y los componentes entre estados sin duplicar la interfaz.

## Tipografía y escala

Los mockups usan Nunito Sans y la escala de producción de `DESIGN.md`, no los tamaños exploratorios de Píldora: ningún texto baja de 12 px, el cuerpo y las acciones usan al menos 14 px, el botón Reservar es 16/900 con 48 px de alto mínimo, y los labels de días y navegación son 12/800.

## Verificación

`render.mjs` genera PNG de 390×844 junto a cada HTML y copias de 412×915 en `gate/`. Estos son los mockups que se deben usar como entrada del `ux-complexity-gate`.
