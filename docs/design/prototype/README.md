# Prototipo completo · Reservo / Kinaf

Un solo prototipo navegable con todas las pantallas que faltaban, para el cliente, el admin y el instructor, bajo el modelo de **horarios fijos** (ver [`docs/product/reevaluacion-horarios-fijos.md`](../../product/reevaluacion-horarios-fijos.md) y el PRD). Reemplaza el diseño pantalla por pantalla: Reservar se convirtió en **Elegir clase** y Mi plan se rediseñó acá.

## Cómo abrirlo

Abrir `index.html` en Chrome, Edge o Safari 18+ (las transiciones usan la View Transitions API). Si el navegador restringe `file://`, desde la raíz del repo: `npx serve docs/design` y entrar a `/prototype/`.

- A la derecha (o abajo, en un teléfono) están los **controles de demo**, con borde punteado y letra monoespaciada a propósito: no son parte de la app. Sirven para cambiar de rol (cliente, admin, instructor) y saltar a cualquier estado.
- Dentro del teléfono todo se navega tocando: tarjetas, pestañas, avatar, volver.
- `?state=<id>` abre un estado; `?shot=<id>` muestra solo el teléfono (lo usa `render.mjs`).

Datos de ejemplo: hoy es miércoles 11 de noviembre de 2026, 9:41. Sofi tiene el plan Combinado 3 (1 clase de Yoga + 2 libres) con horario fijo lunes 18:00 Pilates, miércoles 19:00 Yoga y viernes 18:00 Gimnasio. El viernes 20 es feriado en algunos estados.

## Pantallas

**Cliente** (pestañas: Mis clases, Mi plan, Pagos; avatar: Perfil)

| Pantalla | Estados |
|---|---|
| Ingresar | normal, error |
| Mis clases | normal, con clase pendiente, clase suspendida por feriado, plan sin horario, sin plan |
| Detalle de clase | tu clase con 24 h o más, confirmar “No voy a ir”, recién cancelada, menos de 24 h, suspendida, usar clase pendiente, recién reservada, cupo completo |
| Elegir clase | lista del día, pendiente de Yoga (solo Yoga), día sin clases |
| Mi plan | normal, con clase pendiente, plan Yoga y Pilates, sin plan |
| Pagos | pendiente, en revisión, pagado, atrasado; subir comprobante (elegir y enviar) |
| Perfil | datos, WhatsApp, cerrar sesión |

**Admin** (pestañas: Hoy, Clientes, Agenda, Pagos; avatar: Ajustes)

| Pantalla | Estados |
|---|---|
| Hoy | normal (avisos y clases de hoy), día cerrado |
| Clase del día | anotados, confirmar ausente, ausente marcado, confirmar suspender |
| Clientes | lista, búsqueda sin resultados |
| Ficha de cliente | activa con pendiente, sin horario, sin plan |
| Asignar plan y horario | plan, horarios por cupo (con completos), último cupo con fecha de inicio |
| Agenda | día con clases, día cerrado |
| Horario de clase | nuevo, bajar cupo bloqueado |
| Cerrar un día | motivo, dónde e impacto |
| Pagos | para revisar y atrasadas, revisar comprobante, registrar un pago |
| Ajustes y planes | ajustes, planes, editar plan con cupos |

**Instructor**: Hoy (solo sus clases) y clase en solo lectura.

## Flujos principales

- **No voy a ir** (cliente): Mis clases → tarjeta → “No voy a ir” → confirmar. Queda una clase pendiente con Deshacer y el botón “Elegir otra clase”.
- **Usar una clase pendiente**: aviso en Mis clases o Mi plan → “Elegir clase” → día → tarjeta → “Usar clase pendiente”. Solo aparecen las clases de las actividades del cupo de la clase perdida (o todas si el cupo es libre) y hasta el vencimiento.
- **Menos de 24 h**: el detalle no tiene cancelar; explica que hay que avisar a Kinaf y ofrece WhatsApp.
- **Marcar ausente** (admin): Hoy → clase → persona → confirmar. Le da una clase pendiente; se puede deshacer.
- **Cargar horario fijo**: Hoy → aviso “no tiene horario” (o Clientes → ficha) → un paso por cupo del plan → confirmar con la fecha de inicio.
- **Feriado**: Agenda → día → “Cerrar el viernes 20” → ver impacto → confirmar.
- **Planes por cupos**: Ajustes → Planes → plan → cada cupo con cantidad y actividades (una, varias o cualquiera).

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html`, `app.css`, `data.js`, `app.js`, `runtime.js` | El prototipo (sin dependencias). `app.css` hereda de `../pildora/theme.css` y de los componentes de Reservar y Detalle (PR #3). |
| `render.mjs` | Renderiza cada estado: 390×844 en `screens/` y 412×915 en `screens/gate/` (no versionado). |
| `gate.mjs` | Capa automática del ux-complexity-gate (DOM + axe) y capturas con marcas numeradas. |
| `tasks.json`, `tasks.mjs` | Toques por tarea desde el inicio (A3), tocando la interfaz real. |
| `gate/` | Reportes del gate (automático, tareas y visual). |

Para regenerar: `npm i -D playwright @axe-core/playwright` (fuera del repo) y `node render.mjs`, `node gate.mjs`, `node tasks.mjs`.
