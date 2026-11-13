import { Link } from '@adonisjs/inertia/react'
import { Search, Users } from 'lucide-react'
import { AdminLayout } from '~/components/admin_layout'
import { EmptyState } from '~/components/empty_state'
import { Button } from '~/components/ui/button'

type AdminClientListItem = {
  id: number
  fullName: string
  initials: string
  email: string
  summary: string
}

export default function AdminClientsIndex({
  query,
  items,
}: {
  query: string
  items: AdminClientListItem[]
}) {
  const hasSearch = query.trim().length > 0

  return (
    <AdminLayout
      tab="clients"
      title="Clientes"
      dock={
        <Button asChild>
          <Link href="/admin/clientes/nuevo">Dar de alta un alumno</Link>
        </Button>
      }
    >
      <search className="mt-4 block">
        <form action="/admin/clientes" method="get" className="grid gap-1.5">
          <label htmlFor="query" className="text-sm font-extrabold">
            Buscar
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
              strokeWidth={2.3}
              aria-hidden="true"
            />
            <input
              id="query"
              name="q"
              type="search"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              defaultValue={query}
              placeholder="Nombre o email"
              className="min-h-12 w-full rounded-full border-2 border-transparent bg-input py-2 pr-4 pl-12 text-base font-bold outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </form>
      </search>

      {items.length > 0 ? (
        <ul className="mt-5 grid">
          {items.map((client) => (
            <li key={client.id}>
              <Link
                href={`/admin/clientes/${client.id}`}
                viewTransition
                className="flex min-h-[60px] items-center gap-3 border-b border-border py-2 no-underline"
              >
                <span
                  aria-hidden="true"
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-wash-celeste text-sm font-black"
                >
                  {client.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-base leading-tight font-black">
                    {client.fullName}
                  </strong>
                  <span className="mt-0.5 block text-sm leading-tight font-bold text-muted-foreground">
                    {client.summary}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : hasSearch ? (
        <EmptyState icon={Users} title={`No encontramos a "${query.trim()}".`}>
          Revisá cómo está escrito o buscá por nombre o email.
        </EmptyState>
      ) : (
        <EmptyState icon={Users} title="Todavía no hay alumnos.">
          Dales de alta para que puedan entrar con su link de acceso.
        </EmptyState>
      )}
    </AdminLayout>
  )
}
