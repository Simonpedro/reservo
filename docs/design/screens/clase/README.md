# Detalle de clase · Reservo / Kinaf

Mockups mobile-first de la pantalla que se abre al tocar una tarjeta en Reservar. Es una página nueva (no una hoja): muestra la actividad, el día y horario, el instructor, el centro (solo el nombre), el cupo o estado, y como máximo una acción según el caso.

El encabezado hereda la forma, la foto y el título de la tarjeta, con una View Transition de elemento compartido. Volver deshace la transición.

## Inventario de estados

| Archivo | Estado |
|---|---|
| `bookable.html` | Pilates del miércoles 18:00, 2 lugares libres, botón Reservar. |
| `success.html` | Acaba de reservar: aviso reversible con Deshacer y estado Ya reservada. |
| `booked.html` | Yoga ya reservada, con más de 24 h: botón Cancelar reserva. |
| `cancel-confirm.html` | Hoja de confirmación sobre el detalle de Yoga, con dos acciones. |
| `late-cancel.html` | Yoga a menos de 24 h: aviso de WhatsApp desde Perfil, sin botón. |
| `full.html` | Gimnasio con cupo completo, explicación y sin acción. |
| `not-in-plan.html` | Gimnasio no incluida en un plan de Yoga y Pilates, explicación y sin acción. |

Cuadros de la transición (de la tarjeta de Pilates al detalle): `transition-1-tapped.png`, `transition-2-morph.png`, `transition-3-settled.png`.

## Prototipo vivo

`prototype.html` es un prototipo interactivo con `document.startViewTransition` y `view-transition-name` en el fondo de la tarjeta, la foto y el título.

Cómo abrirlo:

1. En Chrome, Edge o Safari 18+ (Firefox todavía no soporta View Transitions), abrir el archivo `docs/design/screens/clase/prototype.html`.
2. Si el navegador restringe `file://`, desde la raíz del repo: `npx serve docs/design/screens` y entrar a [http://localhost:3000/clase/prototype.html](http://localhost:3000/clase/prototype.html).

Toque una tarjeta para ver la transición; Volver la invierte. En Pilates se puede Reservar y Deshacer; en Yoga, Cancelar reserva (con confirmación).

## Tipografía y escala

Misma escala de producción de `DESIGN.md` que Reservar: nada bajo 12 px, cuerpo y acciones ≥ 14 px, título de pantalla 32/900, botón de acción 16/900 con 48 px de alto.
