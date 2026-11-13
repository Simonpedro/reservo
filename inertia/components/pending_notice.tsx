import { Link } from '@adonisjs/inertia/react'
import { Ticket } from 'lucide-react'
import type { PendingNotice as PendingNoticeData } from '#services/my_classes'
import { Notice } from '~/components/notice'
import { Button } from '~/components/ui/button'

export function pendingCountText(count: number) {
  return count === 1 ? 'Tenés 1 clase pendiente' : `Tenés ${count} clases pendientes`
}

export function activitiesText(activities: string[] | null) {
  if (!activities) return 'Vale para cualquier actividad de tu plan.'
  return `Vale para ${new Intl.ListFormat('es-AR', { type: 'disjunction' }).format(activities)}.`
}

/**
 * The pending classes notice, docked with its only action: "Elegir clase".
 */
export function PendingDock({ pending }: { pending: PendingNoticeData }) {
  return (
    <>
      <Notice icon={Ticket} title={pendingCountText(pending.count)} className="mb-2.5">
        {`${activitiesText(pending.activities)} ${pending.count === 1 ? 'Usala' : 'Usalas'} hasta el ${pending.expiresLabel}.`}
      </Notice>
      <ChooseClassButton />
    </>
  )
}

export function ChooseClassButton() {
  return (
    <Button asChild>
      <Link route="client.choose">Elegir clase</Link>
    </Button>
  )
}
