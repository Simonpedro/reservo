# Reservo · App de turnos y gestión (PRD v0)

**Reservo** (reservo.fit) es un producto genérico para centros de kinesiología, gimnasios y estudios. **Kinaf** (centro de kinesiología y actividad física, Rosario) es el primer cliente y el que define las reglas. App para que los clientes reserven clases dentro de su plan y para que los administradores gestionen planes, clases, asistencia y pagos.

> Estado: borrador surgido de la llamada del 2026-11-11. Más adelante pasa a un Issue de GitHub; el repo todavía no existe.

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

**Identidad visual:** la dirección elegida es **Píldora**. El sistema de diseño (tokens shadcn, tipografía, radios, componentes, contraste y voz) está en [`DESIGN.md`](./DESIGN.md). Los mockups de referencia están en [`docs/design/pildora/`](./docs/design/pildora/). La navegación del cliente se propone en [`docs/design/navegacion-cliente.md`](./docs/design/navegacion-cliente.md).

## 1. Planes
- Un plan se define por **clases por semana** (1x a 5x) y puede **mezclar actividades** (ej.: "1 Gym + 1 Pilates + 1 Yoga").
- Actividades de Kinaf: Gimnasio, Pilates y Yoga. Kinesiología también existe en el centro; **ABIERTO:** si se modela como otra actividad. Cada una es una actividad distinta; no hay clases intercambiables entre actividades.
- Un plan puede permitir elegir **cualquier actividad** (ej.: 3 clases por semana de las actividades que el cliente elija) o limitarse a **actividades específicas**. Lo define el admin (los dueños del negocio). Un plan de clases libres es más caro que uno con actividades específicas.
- Cada plan tiene su **precio** configurable por el admin. Extras aparte (ej.: Rutina personalizada Gym $10.000).
- **Renovación automática mensual.**
- **Un plan activo por cliente.**
- Cuota de referencia: se paga del 1 al 10 de cada mes, en efectivo o por transferencia.
- **ABIERTO:** cuándo aplica un cambio de plan. Tendencia: flexible, y el plan nuevo arranca de cero.

## 2. Clases y horarios
- Horarios **semanales recurrentes** que **varían según el día** de la semana.
- **Cupo por clase.**
- **Centros:** Kinaf tiene dos centros físicos, el centro de Mendoza y el centro de Ovidio Lagos. Cada clase pertenece a un centro (la clase tiene la propiedad `centro`). Sirve para dos cosas: al mostrar una clase se indica en qué centro está, y en los reportes se puede ver la proporción de ingresos de cada centro.
- Se permiten **varias clases en simultáneo** si el espacio físico lo permite.

## 3. Portal del cliente
- Reserva clases **dentro de los límites de su plan** (clases por semana, actividades permitidas) y del **mes de facturación**.
- Mensaje cuando ya usó todas las clases de la semana.
- Opción de **reservar el mes completo** al inicio del ciclo. **ABIERTO:** si es un atajo o el flujo principal.
- **Cancelar solo con 24 h o más de anticipación**; el lugar vuelve al cupo.
- Cancelación tardía: solo por WhatsApp y la hace el admin.

## 4. Asistencia
- Una reserva cuenta como **presente por defecto**.
- El admin marca **ausencia** a mano; eso habilita **una reserva de recuperación** dentro del mes de facturación.
- Las ausencias se reinician cada mes.

## 5. Pagos
- Estados: **pendiente, en revisión, pagado, no pagado**.
- El cliente sube el comprobante (imagen o PDF) y el pago pasa a **en revisión**; el admin lo verifica y pasa a **pagado**.
- Pagos registrados por el admin quedan directamente en **pagado**.
- El admin puede **forzar pagado** en cualquier momento.
- Comprobante rechazado: se anula y el cliente vuelve a subir otro.
- El cliente ve su **historial de pagos** y el estado actual.

## 6. Inicio del admin
- Información relevante para tomar decisiones. **ABIERTO:** qué contenido concreto.

## 7. Rol instructor
- Solo lectura: ve los **asistentes de las clases de hoy**.

## 8. Notificaciones
- v1 sin notificaciones proactivas (ni push ni email ni WhatsApp). Solo **avisos dentro del portal**.

## 9. Roles y usuarios
- **Dos admins**, los dueños.
- Instructores (solo lectura).
- Clientes.

## Preguntas abiertas
1. Cuándo aplica un cambio de plan (inmediato con plan nuevo desde cero, o al próximo ciclo).
2. Qué muestra el inicio del admin.
3. Reserva del mes completo: atajo o flujo principal.
4. Kinesiología: si se modela como otra actividad.
