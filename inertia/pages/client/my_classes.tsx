import { usePage } from '@inertiajs/react'
import { CalendarDays, Repeat } from 'lucide-react'
import type { MyClassesView } from '#services/my_classes'
import { ClassCard } from '~/components/class_card'
import { ClientLayout } from '~/components/client_layout'
import { EmptyState } from '~/components/empty_state'
import { PendingDock } from '~/components/pending_notice'
import { WhatsappButton } from '~/components/whatsapp_button'
import type { PageProps } from '~/types'

export default function MyClasses({ view }: { view: MyClassesView }) {
  const center = usePage<PageProps>().props.tenant?.name ?? 'tu centro'

  if (view.state === 'no_plan') {
    return (
      <ClientLayout tab="classes" title="Mis clases" dock={<WhatsappButton />}>
        <EmptyState icon={CalendarDays} title="Todavía no tenés un plan.">
          {`Escribile a ${center} para elegir tu plan y tus horarios. Después tus clases aparecen acá.`}
        </EmptyState>
      </ClientLayout>
    )
  }

  if (view.state === 'no_schedule') {
    return (
      <ClientLayout tab="classes" title="Mis clases" dock={<WhatsappButton />}>
        <EmptyState icon={Repeat} title={`${center} está armando tu horario.`}>
          {`Ya tenés tu plan. Cuando ${center} cargue tus horarios fijos, tus clases aparecen acá.`}
        </EmptyState>
      </ClientLayout>
    )
  }

  const dock = view.pending ? <PendingDock pending={view.pending} /> : undefined

  if (view.weeks.length === 0) {
    return (
      <ClientLayout tab="classes" title="Mis clases" dock={dock} tallDock>
        <EmptyState icon={CalendarDays} title="No tenés clases estas dos semanas.">
          Cuando haya clases de tu horario fijo, aparecen acá.
        </EmptyState>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout tab="classes" title="Mis clases" dock={dock} tallDock>
      {view.weeks.map((week, index) => (
        <section key={week.title} aria-labelledby={`semana-${index}`}>
          <h2
            id={`semana-${index}`}
            className="mt-[18px] mb-2 text-lg font-black tracking-[-0.035em]"
          >
            {week.title}
          </h2>
          <div className="grid gap-2.5">
            {week.classes.map((card) => (
              <ClassCard key={card.bookingId} card={card} href={`/clases/${card.bookingId}`} />
            ))}
          </div>
        </section>
      ))}
    </ClientLayout>
  )
}
