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
```

Los tests usan exclusivamente `reservo_test`; migran, siembran y aíslan los casos funcionales con transacciones. `.env.test` es local y está ignorado para evitar publicar claves o conexiones de prueba.

## Multi-tenancy

El tenant se resuelve desde `<slug>.reservo.fit` o `<slug>.localhost`. En desarrollo y tests también se admiten `x-tenant` y `DEFAULT_TENANT_SLUG`; nunca en producción. El apex y `www` muestran una portada genérica. Un subdominio desconocido responde 404.

El tema vive en `tenants.theme` como JSON y se convierte a variables CSS de shadcn en el layout raíz. Toda tabla de negocio futura debe incluir `tenant_id`, y toda consulta debe estar limitada al tenant del request.

## Base de datos y Supabase

Lucid usa una única variable `DATABASE_URL`. Activá `DB_SSL=true` en Supabase.

- Conexión directa (`db.<ref>.supabase.co:5432`): apropiada si Fly tiene conectividad IPv6 y se desean conexiones directas.
- Supavisor session pooler (puerto 5432): opción recomendada para un proceso web persistente con conectividad IPv4.
- Transaction pooler (puerto 6543): pensado para conexiones breves/serverless; tiene restricciones como prepared statements y no es la primera opción para este deploy.

La misma URL se usa para la app y el `release_command`, por lo que debe permitir migraciones.

## Fly.io

`fly.toml` usa `gru`, puerto interno `8080`, `/health` y ejecuta `node ace migration:run --force` antes de cada release. Antes de desplegar, configurá `APP_KEY`, `APP_URL` y `DATABASE_URL` como secretos o variables de la app, además de `DB_SSL=true`. Este proyecto no contiene valores de producción ni crea o despliega recursos.

`PRD.md` es la fuente de verdad del producto.
