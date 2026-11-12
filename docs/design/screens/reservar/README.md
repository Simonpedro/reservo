# Reservar · Reservo / Kinaf

Mockups mobile-first de la pantalla de inicio del portal del cliente. Reservar concentra la agenda diaria, el saldo semanal del plan, la reserva y cancelación de clases, las recuperaciones y el atajo para reservar el mes completo.

Todos los estados usan la misma semana (lunes 9 a domingo 15), la misma persona (Sofi) y el plan de 3 clases por semana. La navegación inferior mantiene exactamente tres destinos: Reservar, Mi plan y Pagos; Perfil se abre desde el avatar.

## Inventario de estados

| Archivo | Estado |
|---|---|
| `list.html` | Miércoles por defecto: Pilates disponible y seleccionada, Yoga reservada, Gimnasio completo, saldo semanal y atajo mensual. |
| `success.html` | Pilates reservada, confirmación reversible con Deshacer y aviso de las 3 clases semanales ya usadas. |
| `cancel.html` | Yoga reservada y seleccionada con más de 24 horas de anticipación; acción primaria de cancelación. |
| `cancel-confirm.html` | Confirmación de cancelación en hoja inferior, con dos acciones. |
| `late-cancel.html` | Yoga a menos de 24 horas; aviso de contacto por WhatsApp desde Perfil, sin CTA de cancelación. |
| `month-confirm.html` | Confirmación del atajo mensual dentro de los límites del plan, con dos acciones. |
| `empty.html` | Domingo 15 sin clases; la tira semanal queda disponible para probar otro día. |
| `recovery.html` | Agenda por defecto con una clase de recuperación disponible durante el mes de facturación. |

`screen.css` contiene las medidas de producción y los ajustes de composición. `screen.js` comparte la estructura semántica y los componentes entre estados sin duplicar la interfaz.

## Tipografía y escala

Los mockups usan Nunito Sans y la escala de producción de `DESIGN.md`, no los tamaños exploratorios de Píldora: ningún texto baja de 12 px, el cuerpo y las acciones usan al menos 14 px, los botones primarios son 16/900 con 48 px de alto mínimo, y los labels de días y navegación son 12/800.

## Verificación

`render.mjs` genera PNG de 390×844 junto a cada HTML y copias de 412×915 en `gate/`. Estos son los mockups que se deben usar como entrada del `ux-complexity-gate`.
