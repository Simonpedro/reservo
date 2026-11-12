# Reservar · Reservo / Kinaf

Mockups mobile-first de la pantalla de inicio del portal del cliente. Reservar concentra la agenda diaria, el saldo semanal del plan (solo si todavía queda alguna clase por reservar) y las recuperaciones. Cada tarjeta de clase es tocable de la misma manera, sin botones ni menús en la tarjeta: abre la pantalla **Detalle de clase**, donde se reserva o se cancela.

Todos los estados usan la misma semana (lunes 9 a domingo 15), la misma persona (Sofi) y el plan de 3 clases por semana, salvo donde se indica. En la tira, los días con una reserva ya hecha se distinguen del día seleccionado. La navegación inferior mantiene exactamente tres destinos: Reservar, Mi plan y Pagos; Perfil se abre desde el avatar.

*Ya reservada*, *Cupo completo*, *No incluida en tu plan* y los lugares libres son una línea más de información, con ícono, junto al horario y el centro. La agenda muestra todas las actividades; si una clase no forma parte del plan, se marca como no incluida. Un chevron discreto, igual en todas las tarjetas, indica que se pueden abrir.

El prototipo vivo de la transición hacia el detalle está en [`../clase/prototype.html`](../clase/prototype.html).

## Inventario de estados

| Archivo | Estado |
|---|---|
| `list.html` | Miércoles por defecto: queda 1 de 3, Pilates disponible, Yoga ya reservada, Gimnasio completo; las tres tarjetas se tocan igual. |
| `empty.html` | Domingo 15 sin clases; la tira semanal queda disponible para probar otro día. |
| `recovery.html` | Agenda por defecto con una clase de recuperación disponible durante el mes de facturación. |
| `week-full.html` | Ya reservó las 3 clases de la semana: sin banner de cupo semanal. |
| `not-in-plan.html` | Plan de Yoga y Pilates: Gimnasio aparece en la lista, marcado como no incluida en tu plan. |

`tapped.html` no es un estado de producto: sirve para el primer cuadro de la transición (la tarjeta de Pilates presionada).

`screen.css` contiene las medidas de producción y los ajustes de composición. `screen.js` comparte la estructura semántica y los componentes entre estados sin duplicar la interfaz.

## Tipografía y escala

Los mockups usan Nunito Sans y la escala de producción de `DESIGN.md`, no los tamaños exploratorios de Píldora: ningún texto baja de 12 px, el cuerpo y las acciones usan al menos 14 px, y los labels de días y navegación son 12/800.

## Verificación

`render.mjs` genera PNG de 390×844 junto a cada HTML y copias de 412×915 en `gate/`. Estos son los mockups que se deben usar como entrada del `ux-complexity-gate`.
