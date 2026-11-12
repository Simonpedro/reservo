# Reservar · Reservo / Kinaf

Mockups mobile-first de la pantalla de inicio del portal del cliente. Reservar concentra la agenda diaria, el saldo semanal del plan (solo si todavía queda alguna clase por reservar), la reserva y cancelación de clases, las recuperaciones y el atajo para reservar el mes completo.

Todos los estados usan la misma semana (lunes 9 a domingo 15), la misma persona (Sofi) y el plan de 3 clases por semana. En la tira, lunes y miércoles se distinguen porque Sofi ya tiene una reserva esos días (el lunes reserva una clase que no se ve en la agenda del miércoles). La navegación inferior mantiene exactamente tres destinos: Reservar, Mi plan y Pagos; Perfil se abre desde el avatar.

La reserva se hace con un botón **Reservar** en la tarjeta, cuando esa acción está disponible. Las clases ya reservadas muestran el estado *Ya reservada* y, si faltan 24 h o más, un botón **Cancelar**. Las de cupo completo no tienen botón de reserva. Cada tarjeta indica horario, instructor, centro y lugares libres.

## Inventario de estados

| Archivo | Estado |
|---|---|
| `list.html` | Miércoles por defecto: queda 1 de 3, Pilates con botón Reservar, Yoga ya reservada (se puede cancelar), Gimnasio completo, atajo mensual y días con reserva marcados. |
| `success.html` | Acaba de reservar Pilates: confirmación reversible con Deshacer, sin banner semanal (ya no le queda cupo esta semana). |
| `cancel-confirm.html` | Confirmación de cancelación en hoja inferior, con dos acciones. |
| `late-cancel.html` | Yoga a menos de 24 horas; aviso de contacto por WhatsApp desde Perfil, sin botón de cancelar. |
| `month-confirm.html` | Confirmación del atajo mensual dentro de los límites del plan, con dos acciones. |
| `empty.html` | Domingo 15 sin clases; la tira semanal queda disponible para probar otro día. |
| `recovery.html` | Agenda por defecto con una clase de recuperación disponible durante el mes de facturación. |
| `week-full.html` | Ya reservó las 3 clases de la semana: sin banner de cupo semanal, Pilates y Yoga reservadas (se pueden cancelar). |

`screen.css` contiene las medidas de producción y los ajustes de composición. `screen.js` comparte la estructura semántica y los componentes entre estados sin duplicar la interfaz.

## Tipografía y escala

Los mockups usan Nunito Sans y la escala de producción de `DESIGN.md`, no los tamaños exploratorios de Píldora: ningún texto baja de 12 px, el cuerpo y las acciones usan al menos 14 px, los botones Reservar son 16/900 con 48 px de alto mínimo, Cancelar tiene 44 px de alto mínimo, y los labels de días y navegación son 12/800.

## Verificación

`render.mjs` genera PNG de 390×844 junto a cada HTML y copias de 412×915 en `gate/`. Estos son los mockups que se deben usar como entrada del `ux-complexity-gate`.
