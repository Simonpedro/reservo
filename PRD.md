# Reservo · App de turnos y gestión (PRD v0)

**Reservo** (reservo.fit) es un producto genérico para centros de kinesiología, gimnasios y estudios. **Kinaf** (centro de kinesiología y actividad física, Rosario) es el primer cliente y el que define las reglas. App para que los clientes vean y manejen sus clases fijas dentro de su plan, y para que los administradores gestionen planes, horarios, asistencia y pagos.

> Estado: borrador surgido de la llamada del 2026-11-11, actualizado el 2026-11-12 con horarios fijos.

## 0. Producto y arquitectura
- **Multi-tenant desde el día uno**: tabla `tenants` y `tenant_id` en todas las tablas de negocio. Al principio Kinaf es el único tenant y para él es transparente.
- **Un subdominio por tenant**: `<tenant>.reservo.fit`. Kinaf: `kinaf.reservo.fit`.
- **Estilos personalizables por tenant** (colores, logo, nombre).
- El producto tiene opiniones propias sobre cómo se trabaja, basadas en cómo trabaja Kinaf.
- Más adelante: alta de nuevos centros, facturación a centros.
- **Stack:** AdonisJS con Inertia y React (un solo deploy), UI basada en shadcn/ui, Postgres en Supabase (con `DATABASE_URL` vía Lucid ORM) y deploy en Fly.io.
- La personalización por tenant se apoya en los design tokens o variables CSS de shadcn (colores, radios, tipografía y logo por tenant).

### Tema de Kinaf (tenant inicial)
Colores aproximados, tomados de una captura del Instagram (hay que confirmarlos con el logo original):
- Azul marino de fondo de marca: `#001A4D`
- Verde del logo: `#8CC463`
- Celeste del logo: `#5AB8F0`
- Azul del logo: `#3E88F0`
- Verde de acento (títulos destacados en posts): `#6EF04A`
- Blanco para texto sobre azul.
- Logo: tres chevrons apilados (verde, celeste y azul).

**Identidad visual:** la dirección elegida es **Píldora**. El sistema de diseño (tokens shadcn, tipografía, radios, componentes, contraste y voz) está en [`DESIGN.md`](./DESIGN.md). Los mockups de referencia están en [`docs/design/pildora/`](./docs/design/pildora/).

## 1. Planes
- Un plan es un **precio** más una lista de **cupos semanales**. Cada cupo es una cantidad de clases por semana y un conjunto de actividades permitidas: una sola, varias o cualquiera.
- Los arma el admin (los dueños del negocio) con cualquier combinación. Ejemplos: "1 Yoga + 1 Pilates" (dos cupos de 1), "2 de Yoga o Pilates" (un cupo de 2 con dos actividades), "2 libres" (un cupo de 2 con cualquier actividad), "1 Yoga + 2 libres".
- Actividades de Kinaf: Gimnasio, Pilates y Yoga. Kinesiología también existe en el centro; **ABIERTO:** si se modela como otra actividad. Cada una es una actividad distinta; no hay clases intercambiables entre actividades salvo que el cupo lo permita.
- Extras aparte (ej.: Rutina personalizada Gym $10.000). Fuera del MVP.
- **Cuota de noviembre 2026 de Kinaf (planes semilla).** En la lista, "Gym/Pilates" es un cupo que acepta Gimnasio o Pilates. Así, "2 Gym/Pilates + 1 Gym/Pilates" son dos cupos (uno de 2 y otro de 1), ambos de Gimnasio o Pilates, y "1 Gym + 1 Pilates" son dos cupos de 1 de una sola actividad cada uno. Los planes simples (por ejemplo "Pilates 3x semana") son un único cupo de esa actividad.
- **Renovación automática mensual.**
- **Un plan activo por cliente.** Solo el admin asigna o cambia el plan.
- Cuota de referencia: se paga del 1 al 10 de cada mes, en efectivo o por transferencia.
- Cambio de plan: el admin asigna el plan nuevo y su horario fijo en el mismo paso; por defecto aplica desde el lunes siguiente. Las clases pendientes que ya tenía se mantienen hasta su vencimiento.

## 2. Clases, horarios fijos y reservas automáticas
- **Horarios de clase** semanales recurrentes que **varían según el día** de la semana, con **cupo**, instructor y centro.
- **Centros:** Kinaf tiene dos centros físicos, el centro de Mendoza y el centro de Ovidio Lagos. Cada clase pertenece a un centro (la clase tiene la propiedad `centro`). Sirve para dos cosas: al mostrar una clase se indica en qué centro está y quién la dicta (el instructor), y en los reportes se puede ver la proporción de ingresos de cada centro.
- Se permiten **varias clases en simultáneo** si el espacio físico lo permite.
- **Horario fijo.** La gente va casi siempre el mismo día a la misma hora. Al asignar el plan, el admin elige los horarios fijos de la persona: cada cupo del plan se cubre con exactamente tantos horarios como su cantidad, de actividades que ese cupo permite. Solo el admin los asigna y los cambia; un cambio aplica por defecto desde el lunes siguiente.
- **Reservas automáticas.** El sistema genera solo las reservas de los horarios fijos con 4 semanas de anticipación. El modelo de reserva es el mismo; lo único que cambia es quién la crea.
- **Cupo.** El cupo de una clase en una fecha es el cupo del horario menos las reservas activas de esa fecha. Al asignar horarios fijos no se puede superar el cupo: un horario lleno aparece como completo y no se puede elegir. Si el admin baja el cupo por debajo de los horarios fijos actuales, el sistema lo bloquea y muestra quiénes sobran. Sin lista de espera en v1.
- **Feriados y cierres.** El admin cierra un día (en un centro o en todos) o suspende una sola clase. Las reservas afectadas quedan suspendidas y cada persona recibe una clase pendiente. Antes de confirmar, el admin ve cuántas reservas afecta.

## 3. Portal del cliente
- La persona no reserva semana a semana: sus clases ya están reservadas por el horario fijo. La app le muestra sus próximas clases, su plan y sus pagos.
- **Cancelar una fecha (faltar una vez):** solo con 24 h o más de anticipación, desde el detalle de la clase. El lugar vuelve al cupo de esa fecha y la persona recibe una **clase pendiente**. El horario fijo no cambia.
- **No existe la cancelación tardía del lado del alumno.** Con menos de 24 h no hay acción en la app: el detalle explica que avise a Kinaf por WhatsApp. El admin, después de hablar, puede marcarlo ausente (ver sección 4).
- **Clases pendientes.** Se generan al cancelar a tiempo, por un feriado o cierre, o cuando el admin marca una ausencia. Se usan reservando a mano una clase con lugar libre, **dentro del mismo cupo del plan que se perdió**: con "1 Yoga + 1 Pilates", si pierde Yoga recupera solo Yoga; con "2 de Yoga o Pilates", puede recuperar cualquiera de las dos; si el cupo es libre, cualquier actividad. Una pendiente se puede usar **antes de la fecha perdida** (por ejemplo, cancela el jueves y recupera el martes de esa misma semana). Vencen el domingo de la semana siguiente a la clase perdida; no se acumulan. Si se cancela a tiempo una reserva hecha con una pendiente, la pendiente vuelve con su vencimiento original.
- **Vacaciones:** la persona cancela clase por clase. **ABIERTO:** pausar plan o modo vacaciones.

- **Acceso.** El alumno no se registra solo: lo da de alta el admin, que le comparte un **link de acceso** (invitación personal). Con ese link entra sin contraseña.

### Navegación
Tres pestañas abajo. Al abrir la app, el cliente entra a **Mis clases**. Perfil no va en la barra: se abre desde el avatar del encabezado. Las páginas internas ocultan la barra y el avatar.
- **Mis clases** (home): las próximas clases (esta semana y la próxima). Cada tarjeta abre el detalle de la clase. Si hay clases pendientes, un aviso de texto lleva a Elegir clase.
- **Detalle de clase** (interna): actividad, día y horario, instructor, centro y estado. Como máximo una acción: "No voy a ir" (con 24 h o más) o "Usar clase pendiente" (cuando se abre desde Elegir clase).
- **Elegir clase** (interna, solo desde el aviso de pendiente): agenda por día, hasta el vencimiento de la pendiente, con las clases donde se puede usar.
- **Mi plan:** el horario fijo, el plan con sus cupos, las clases pendientes con su vencimiento y la renovación mensual. Sin plan: explicación y contacto por WhatsApp. No muestra precio ni cambio de plan.
- **Pagos:** cuota del mes, estado, subir el comprobante e historial.
- **Perfil** (avatar): datos, cerrar sesión y el contacto de WhatsApp.

## 4. Asistencia
- Una reserva cuenta como **presente por defecto**.
- El admin marca **ausente** a mano, por ejemplo cuando el alumno avisa con menos de 24 h. Marcar ausente da una clase pendiente y, si la clase todavía no pasó, libera el lugar. Es la única forma en que el admin da una pendiente.

## 5. Pagos
- Estados: **pendiente, en revisión, pagado, atrasado**. Atrasado se muestra desde el día 11 si la cuota no se pagó; no bloquea nada (ni reservas ni la app). Lo que se haga con un atrasado lo decide el admin.
- El cliente sube el comprobante (imagen o PDF) y el pago pasa a **en revisión**; el admin lo verifica y pasa a **pagado**.
- Pagos registrados por el admin quedan directamente en **pagado**.
- El admin puede **forzar pagado** en cualquier momento.
- Comprobante rechazado: se anula y el cliente vuelve a subir otro.
- El cliente ve su **historial de pagos** y el estado actual.

## 6. Admin
Mobile first, con la misma gramática que el cliente. Cuatro pestañas: **Hoy**, **Clientes**, **Agenda** y **Pagos**. El avatar abre Ajustes (Planes).
- **Hoy** (home): clases de hoy con sus asistentes y avisos (comprobantes en revisión, personas sin horario asignado). Primera propuesta para "qué muestra el inicio del admin".
- **Clase del día:** asistentes de esa fecha, marcar ausente (da una clase pendiente) y suspender la clase.
- **Clientes** y **ficha de cliente:** plan, horario fijo, próximas clases, clases pendientes y pagos.
- **Asignar plan y horario:** un solo flujo en pasos para alta, cambio de horario y cambio de plan: plan, horarios por cupo (los completos no se pueden elegir), desde qué fecha y confirmar.
- **Agenda:** horarios de clase de la semana con su ocupación, crear o editar un horario, y cerrar un día (feriado o cierre) con el impacto antes de confirmar.
- **Pagos:** comprobantes en revisión, registrar un pago, forzar pagado, estados e historial.
- **Planes** (Ajustes): crear y editar planes con nombre, precio y cupos.

## 7. Rol instructor
- **Fuera del MVP** (decidido el 2026-11-12). Queda la idea para después:
- Solo lectura: ve los **asistentes de las clases de hoy** (la pantalla Hoy del admin, sin acciones).

## 8. Notificaciones
- v1 sin notificaciones proactivas (ni push ni email ni WhatsApp). Solo **avisos dentro del portal**.

## 9. Roles y usuarios
- **Dos admins**, los dueños.
- Instructores (solo lectura).
- Clientes.

## Preguntas abiertas
1. Pausar plan o modo vacaciones: si existe, quién lo activa y qué pasa con las reservas automáticas y con la cuota durante la pausa. Por ahora la persona cancela clase por clase.
2. Kinesiología: si se modela como otra actividad.

## Decisiones (registro)
- 2026-11-12 (noche): la pendiente se recupera dentro del mismo cupo; solo el admin da de alta al alumno, que entra con link; el instructor queda fuera del MVP; una pendiente se puede usar antes de la fecha perdida. Siguen abiertas la pausa o modo vacaciones y Kinesiología.
- 2026-11-12: horarios fijos y reservas automáticas; clases pendientes con vencimiento al fin de la semana siguiente; sin cancelación tardía del alumno; planes por cupos; cuota atrasada sin bloqueo. Detalle en [`docs/product/reevaluacion-horarios-fijos.md`](./docs/product/reevaluacion-horarios-fijos.md).
