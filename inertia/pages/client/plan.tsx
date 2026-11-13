import { usePage } from '@inertiajs/react'
import { Calendar, Home, Layers, Repeat } from 'lucide-react'
import type { MyPlanView } from '#services/my_plan'
import { ClientLayout } from '~/components/client_layout'
import { EmptyState } from '~/components/empty_state'
import { InfoLine } from '~/components/info_line'
import { PendingDock } from '~/components/pending_notice'
import { WhatsappButton } from '~/components/whatsapp_button'
import type { PageProps } from '~/types'

export default function Plan({ view }: { view: MyPlanView }) {
  const center = usePage<PageProps>().props.tenant?.name ?? 'tu centro'

  if (view.state === 'no_plan') {
    return (
      <ClientLayout tab="plan" title="Mi plan" dock={<WhatsappButton />}>
        <EmptyState icon={Home} title="Todavía no tenés un plan.">
          {`Escribile a ${center} para elegir tu plan y tus horarios.`}
        </EmptyState>
      </ClientLayout>
    )
  }

  const dock = view.pending ? <PendingDock pending={view.pending} /> : undefined

  return (
    <ClientLayout tab="plan" title="Mi plan" dock={dock} tallDock={Boolean(view.pending)}>
      <section className="mt-[18px]" aria-labelledby="tu-horario">
        <h2 id="tu-horario" className="mb-2 text-lg font-black tracking-[-0.035em]">
          Tu horario
        </h2>
        {view.schedule ? (
          <div className="grid gap-2.5">
            {view.schedule.map((line) => (
              <InfoLine key={line.label} icon={Repeat}>
                {line.label}
              </InfoLine>
            ))}
          </div>
        ) : (
          <p className="text-base leading-snug font-bold text-muted-foreground">
            {`${center} todavía no cargó tus horarios.`}
          </p>
        )}
      </section>

      <section className="mt-[18px]" aria-labelledby="tu-plan">
        <h2 id="tu-plan" className="mb-2 text-lg font-black tracking-[-0.035em]">
          Tu plan
        </h2>
        <p className="text-xl font-black tracking-[-0.035em]">{view.planName}</p>
        <div className="mt-2.5 grid gap-2.5">
          {view.quotas.map((quota) => (
            <InfoLine key={quota.text} icon={Layers}>
              {quota.text}
            </InfoLine>
          ))}
          <InfoLine icon={Calendar}>{view.renewalLabel}</InfoLine>
        </div>
      </section>

      <section className="mt-[18px]">
        <p className="text-base leading-snug font-bold text-muted-foreground">
          {`Tu horario y tu plan los cambia ${center}.`}
        </p>
        <div className="mt-1">
          <WhatsappButton variant="link" />
        </div>
      </section>
    </ClientLayout>
  )
}
