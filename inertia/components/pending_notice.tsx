import { Link } from '@adonisjs/inertia/react'
import { Ticket } from 'lucide-react'
import type { PendingNotice as PendingNoticeData } from '#services/my_classes'
import { pendingCountText, pendingLines } from '#services/pending_text'
import { Notice } from '~/components/notice'
import { Button } from '~/components/ui/button'

/**
 * The pending classes notice, docked with its only action: "Elegir clase".
 */
export function PendingDock({ pending }: { pending: PendingNoticeData }) {
  return (
    <>
      <Notice icon={Ticket} title={pendingCountText(pending.count)} className="mb-2.5">
        {pendingLines(pending.groups)}
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
