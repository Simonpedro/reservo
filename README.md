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

Usuario local creado por el seeder:

- Email: `admin@kinaf.test`
- Contraseña: `KinafDev2026!`

El usuario solo se crea cuando `NODE_ENV` no es `production`.

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

Los tests usan exclusivamente `reservo_test`; migran, siembran y aíslan los casos funcionales y de browser con una transacción global por suite. `.env.test` es local y está ignorado para evitar publicar claves o conexiones de prueba.

Estrategia por niveles (Japa):

- `unit` (`tests/unit`): reglas de negocio puras de `app/services`, sin HTTP ni base.
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
2. `FALLBACK_TENANT_SLUG`, si está definida, también en producción. Sirve mientras no haya DNS propio.
3. Si no, 404.

El tema vive en `tenants.theme` como JSON y se convierte a variables CSS de shadcn en el layout raíz. Toda tabla de negocio futura debe incluir `tenant_id`, y toda consulta debe estar limitada al tenant del request.

## Base de datos y Supabase

Lucid usa una única variable `DATABASE_URL`. Activá `DB_SSL=true` en Supabase.

- Conexión directa (`db.<ref>.supabase.co:5432`): apropiada si Fly tiene conectividad IPv6 y se desean conexiones directas.
- Supavisor session pooler (puerto 5432): opción recomendada para un proceso web persistente con conectividad IPv4.
- Transaction pooler (puerto 6543): pensado para conexiones breves/serverless; tiene restricciones como prepared statements y no es la primera opción para este deploy.

La misma URL se usa para la app y el `release_command`, por lo que debe permitir migraciones.

## Producción

- URL: <https://reservo.fly.dev> (app `reservo` en Fly, región `gru`). Muestra Kinaf vía `FALLBACK_TENANT_SLUG = "kinaf"` en `fly.toml`.
- Base: Supabase, proyecto `reservo` en `sa-east-1`, conectado por el session pooler (Supavisor, puerto 5432).
- Secretos en Fly (`fly secrets set`): `DATABASE_URL`, `APP_KEY`, `APP_URL` y `DB_SSL=true`. El resto de las variables está en `[env]` de `fly.toml`.
- Cada release corre `node ace migration:run --force` (`release_command`).
- El seed de producción (solo el tenant Kinaf, sin usuarios de desarrollo) corre a mano:

```bash
fly ssh console -C "sh -c 'cd /app && npm run seed:prod'"
```

El health check de Fly usa `/health`, que no depende del tenant ni de la base. El repo no contiene valores de producción.

`PRD.md` es la fuente de verdad del producto.
