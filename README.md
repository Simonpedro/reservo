# Reservo

Boilerplate de Reservo, una aplicación multi-tenant para gestionar clases y reservas en centros de kinesiología, gimnasios y estudios. Kinaf es el primer tenant.

## Stack

- AdonisJS 7, Lucid y sesiones
- Inertia 3, React 19 y TypeScript
- Tailwind CSS 4 y shadcn/ui
- PostgreSQL y Japa

## Desarrollo local

Requisitos: Node.js 24, npm 11 y PostgreSQL. El proyecto fija Node `24.22.3` en `.mise.toml`. Las bases locales esperadas son `reservo_dev` y `reservo_test`.

```bash
npm ci
cp .env.example .env
node ace generate:key
node ace migration:fresh --seed
npm run dev
```

Abrí `http://kinaf.localhost:3333`. Si el navegador no resuelve ese host, usá `localhost:3333` con `DEFAULT_TENANT_SLUG=kinaf`.

## Datos semilla y demo

`kinaf_seeder` siembra lo seguro para producción: tenant, centros (Mendoza y Ovidio Lagos), actividades (Gimnasio, Pilates y Yoga) y los planes de la cuota de noviembre 2026, más el plan "2 Gym + 1 Pilates" (no está en esa lista; el precio de $70.000 está estimado a partir de los combinados de 3 clases, que salen todos esa cifra). Es idempotente: busca los planes por nombre, actualiza el precio y reemplaza los cupos solo si nadie los usa (horarios fijos, reservas o pendientes).

`kinaf_demo_seeder` agrega los datos demo. Corre fuera de producción, o en producción solo con `DEMO_SEED=true`. Las fechas son relativas al día en que se siembra:

- Horarios de lunes a sábado en los dos centros: Gimnasio a la mañana y a la tarde, Pilates y Yoga.
- Admin: `admin@kinaf.test` / `KinafDev2026!` en `/login`.
- Alumna demo Sofi Ortiz (`sofi@kinaf.test`): entra sin contraseña con su link de acceso, `http://kinaf.localhost:3333/acceso/demo-sofi-kinaf` (en producción, `https://kinaf.reservo.fit/acceso/demo-sofi-kinaf`; `https://reservo.fly.dev/acceso/demo-sofi-kinaf` sigue funcionando). Plan "2 Gym + 1 Pilates" (precio estimado, ver arriba) con horario fijo miércoles 20:00 y viernes 18:00 Gimnasio, y lunes 18:00 Pilates, todos en Mendoza. Tiene una clase pendiente por cancelación y tres meses pagos.
- Otros 11 alumnos (`<nombre>.<apellido>@kinaf.test`, sin link) con distintos planes: algunos sin horario fijo, Fede Paz sin plan, Mati Ruiz con una pendiente por ausencia.
- Cuotas del mes en todos los estados: pendiente, en revisión (con un comprobante PNG de ejemplo), pagada y atrasada (Mati y Flor deben el mes anterior). Después del día 10, las pendientes del mes también se ven atrasadas.
- Un cierre de todos los centros: el próximo feriado nacional dentro de las 4 semanas, o un "Cierre por mantenimiento" de ejemplo a 10 días.
- Al final corre el proceso diario (reservas de las próximas 4 semanas y cuotas del mes).

El link demo vence a los 30 días de la última siembra; volver a sembrar lo renueva.

Re-sembrar en producción (Fly):

```bash
# Solo lo seguro para producción (planes, centros, actividades)
fly ssh console -C "sh -c 'cd /app && node ace db:seed --files=database/seeders/kinaf_seeder'"
# Solo los datos de Sofi Ortiz (plan, horarios, pendiente, cuotas y link)
fly ssh console -C "sh -c 'cd /app && node ace demo:reset-sofi'"
# Con todos los datos demo
fly ssh console -C "sh -c 'cd /app && DEMO_SEED=true node ace db:seed'"
```

Ojo: con `DEMO_SEED=true` queda en producción el admin demo con la contraseña de arriba. Sirve mientras Kinaf usa la app como demo; antes de cargar datos reales hay que cambiarla.

## Alumnos, links de acceso y reservas

- El alumno no tiene contraseña: entra por `/acceso/<token>`, que abre sesión (con "recordarme") y lo lleva a Mis clases. El link sirve 30 días y se puede reusar; generar uno nuevo (`AccessLinks.issue`) revoca los anteriores. Solo se guarda el SHA-256 del token.
- El admin entra con email y contraseña en `/login`; después del login cada rol va a su inicio (`app/services/role_home.ts`).
- Las reservas de los horarios fijos se generan 4 semanas adelante (`app/services/booking_generator.ts`), en la zona `America/Argentina/Buenos_Aires`, salteando cierres y clases suspendidas. El mismo comando es el proceso diario: también crea la cuota del mes de cada suscripción vigente (`app/services/daily_process.ts`). Es idempotente:

```bash
node ace daily:run                      # todos los tenants
node ace daily:run --tenant=kinaf
node ace bookings:generate              # alias de daily:run
```

El proceso también vence las clases pendientes cuyo `expiresOn` ya pasó (`status → expired`).

**Producción:** el orquestador puede dispararlo de tres maneras (complementarias):

1. Al arrancar el servidor web (`providers/daily_boot_provider.ts`, solo con `NODE_ENV=production` y `DAILY_RUN_ON_BOOT` distinto de `false`): corre una vez en background; no bloquea el arranque.
2. Máquina programada en Fly (diaria):

```bash
fly machine run . --schedule daily --command "node ace daily:run"
```

3. Cron externo contra el endpoint (requiere `DAILY_RUN_TOKEN` en secretos de Fly):

```bash
curl -X POST "https://reservo.fly.dev/internal/daily-run" \
  -H "Authorization: Bearer $DAILY_RUN_TOKEN"
```

Sin `DAILY_RUN_TOKEN` configurado, el endpoint responde 404.

## Pagos

- La cuota del mes vale el precio del plan y vence el 10. "Atrasada" se calcula (sin pagar y hoy pasado el día 10); es solo visual y no bloquea nada. Si el alumno ya subió un comprobante, se muestra "En revisión" aunque sea después del 10 (`statusOf` en `app/services/fees.ts`).
- El comprobante (imagen o PDF, máx. 5 MB) se guarda en Postgres (`receipts.data`). `GET /pagos/comprobantes/:id` lo sirve solo al alumno dueño o al admin del tenant.
- Los alias de transferencia son datos del tenant (`tenants.transfer_aliases`).

## Ajustes y agenda del admin

- **Ajustes** (desde el avatar): Planes, Actividades y Centros. Las actividades tienen nombre y color de tarjeta (celeste, verde o azul); los centros (Mendoza, Ovidio Lagos), nombre. El slug sale del nombre y no cambia al renombrar; un nombre repetido (sin importar mayúsculas ni tildes) se rechaza. No se desactivan ni se borran (`app/services/admin_catalog.ts`).
- **Agenda › Semana** (`/admin/agenda/semana`): una semana con fechas (de lunes a sábado, y domingo si hay clases), como el Excel de Kinaf. Arranca en la semana actual y se mueve con las flechas (`?semana=<fecha>`: cualquier fecha lleva al lunes de su semana; también se ven semanas pasadas). Cada horario activo con los nombres de quienes lo tienen como horario fijo ese mismo día, y la ocupación que suman: si Tomás pasa del miércoles al viernes desde el lunes 23, aparece en el miércoles hasta la semana del 16 y en el viernes desde la del 23. Es solo lectura. Filtro por centro (`?centro=<slug>`) si hay más de uno. En el teléfono va un día abajo del otro; en pantallas anchas, una columna por día (`app/services/admin_week.ts`).

## Scripts

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
npm run format
npm test
npm run test:coverage
npm run seed:prod
```

## Testing

Los tests usan exclusivamente `reservo_test`; migran y siembran (incluida la alumna demo) al arrancar, y cada grupo aísla sus escrituras con una transacción global por test (`group.each.setup(() => testUtils.db().withGlobalTransaction())`). Los datos se arman con las factories de `database/factories` y los builders de `tests/support/scenario.ts`. `.env.test` es local y está ignorado para evitar publicar claves o conexiones de prueba.

Estrategia por niveles (Japa):

- `unit` (`tests/unit`): reglas de negocio de `app/services` (por ejemplo el generador de reservas, con un "ahora" fijo), sin HTTP.
- `functional` (`tests/functional`): rutas y middleware por HTTP con `@japa/api-client`, sesión, Inertia y Shield.
- `browser` (`tests/browser`): flujos clave en Chromium con Playwright (`@japa/browser-client`).

```bash
npx playwright install chromium   # una vez, para la suite browser
npm test                          # todas las suites
node ace test functional          # una suite
npm run test:coverage             # todas las suites con coverage
```

`test:coverage` usa c8 sobre el loader TypeScript de Adonis, que genera source maps inline: los reportes apuntan a líneas de los `.ts`. Mide `app/`, `start/` y `database/` (sin `database/schema.ts`, que es generado). `inertia/` queda afuera: ese código corre en el navegador, no en el proceso de Node que mide c8. Salidas en `coverage/`: texto en consola, `lcov.info` + `lcov-report/` y `coverage-summary.json`.

CI (`.github/workflows/ci.yml`) corre en cada push a `main`: Postgres 17 de servicio con `reservo_test`, `.env.test` armado en el job, chequeo de Prettier, lint, typecheck, build y `test:coverage`. El resumen de coverage aparece en el resumen del job y `coverage/` queda como artifact.

## Multi-tenancy

El tenant se resuelve desde `<slug>.reservo.fit` o `<slug>.localhost`. El apex y `www` muestran una portada genérica. Un subdominio desconocido responde 404.

Cualquier otro host (por ejemplo `reservo.fly.dev`) resuelve así:

1. En desarrollo y tests, el header `x-tenant` o `DEFAULT_TENANT_SLUG`. Nunca en producción.
2. `FALLBACK_TENANT_SLUG`, si está definida, también en producción. Así `reservo.fly.dev` sigue mostrando Kinaf.
3. Si no, 404.

Los links de acceso que genera el admin van siempre a `https://<slug>.reservo.fit`, no al host de fallback.

El tema vive en `tenants.theme` como JSON y se convierte a variables CSS de shadcn en el layout raíz. Toda tabla de negocio futura debe incluir `tenant_id`, y toda consulta debe estar limitada al tenant del request.

## Base de datos y Supabase

Lucid usa una única variable `DATABASE_URL`. Activá `DB_SSL=true` en Supabase.

- Conexión directa (`db.<ref>.supabase.co:5432`): apropiada si Fly tiene conectividad IPv6 y se desean conexiones directas.
- Supavisor session pooler (puerto 5432): opción recomendada para un proceso web persistente con conectividad IPv4.
- Transaction pooler (puerto 6543): pensado para conexiones breves/serverless; tiene restricciones como prepared statements y no es la primera opción para este deploy.

La misma URL se usa para la app y el `release_command`, por lo que debe permitir migraciones.

## Producción

- URL de Kinaf: <https://kinaf.reservo.fit> (app `reservo` en Fly, región `gru`). <https://reservo.fly.dev> sigue mostrando Kinaf vía `FALLBACK_TENANT_SLUG = "kinaf"` en `fly.toml`.
- Base: Supabase, proyecto `reservo` en `sa-east-1`, conectado por el session pooler (Supavisor, puerto 5432).
- Secretos en Fly (`fly secrets set`): `DATABASE_URL`, `APP_KEY`, `APP_URL`, `DB_SSL=true` y opcionalmente `DAILY_RUN_TOKEN` para el cron del proceso diario. El resto de las variables está en `[env]` de `fly.toml`.
- Cada release corre `node ace migration:run --force` (`release_command`).
- El seed de producción (solo el tenant Kinaf, sin usuarios de desarrollo) corre a mano:

```bash
fly ssh console -C "sh -c 'cd /app && npm run seed:prod'"
```

El health check de Fly usa `/health`, que no depende del tenant ni de la base. El repo no contiene valores de producción.

`PRD.md` es la fuente de verdad del producto.
