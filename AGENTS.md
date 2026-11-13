# Reservo engineering conventions

## Source of truth

- `PRD.md` defines the product. Do not implement business features beyond its current scope without an explicit request.
- Keep the codebase a small, conventional AdonisJS 7 application running on Node.js 24.

## Multi-tenancy

- Every business table must have a non-null `tenant_id` foreign key.
- Every business query must be scoped by the request tenant. Never query a business record by ID alone.
- Resolve tenants through `TenantMiddleware`; production tenants come only from `<slug>.reservo.fit`.
- The `x-tenant` header and `DEFAULT_TENANT_SLUG` are development/test conveniences only.
- `FALLBACK_TENANT_SLUG` (optional, also in production) resolves hosts outside `<slug>.reservo.fit`, the apex/`www` and `*.localhost` to one tenant. It exists for hosts like `reservo.fly.dev` while there is no DNS; Fly sets it to `kinaf`.
- Tenant mismatch in an authenticated session must fail closed.

## Users and roles

- Roles are `admin`, `instructor`, and `client`.
- Authentication is session-based and login lookup is always scoped by `tenant_id` plus email.
- Protect role-specific routes with both `auth` and `role` middleware.

## Theme and UI

- Tenant theme data lives in `tenants.theme`; CSS conversion lives in `app/services/tenant_theme.ts`.
- Inject tenant variables in `resources/views/inertia_layout.edge`. Components consume shadcn tokens and must not hard-code tenant colors.
- Reuse shadcn components from `inertia/components/ui`. Add components with `npx shadcn@latest add <name>`.
- User-facing copy is Spanish (`es-AR`).

## Database

- Use timestamp-prefixed Lucid migrations.
- Migrations must be reversible and PostgreSQL-compatible.
- Use `DATABASE_URL`; enable remote TLS with `DB_SSL=true`.
- Seed production-safe tenant data separately from development-only users.

## Testing and checks

- Tests use only `reservo_test`. Never point test configuration at another database.
- Add unit tests for pure helpers and functional tests for middleware/routes.
- Before handing off changes, run:
  - `npm run format`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm test`
- Keep `/health` independent of tenant and database resolution.

## Git workflow

- Commits are small, one change each, with concise English messages (e.g. `Add tenants migration`).
- Work on a branch and open a pull request to `main`; do not push directly to `main`.
- Exception: for the initial MVP, Simon authorized committing directly to `main`.

## Shared skills toolkit

- Shared agent skills live in <https://github.com/Simonpedro/toolkit>.
- Run `ux-complexity-gate` and `design-fidelity-gate` on every screen before merging it.
