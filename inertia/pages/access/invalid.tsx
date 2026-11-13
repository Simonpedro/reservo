import { Head, usePage } from '@inertiajs/react'
import { Link2Off } from 'lucide-react'
import { Dock } from '~/components/client_layout'
import { EmptyState } from '~/components/empty_state'
import { WhatsappButton } from '~/components/whatsapp_button'
import type { PageProps } from '~/types'

const TITLES = {
  unknown: 'Este link no funciona.',
  expired: 'Este link ya venció.',
  revoked: 'Este link ya no sirve.',
} as const

export default function InvalidAccess({ reason }: { reason: keyof typeof TITLES }) {
  const center = usePage<PageProps>().props.tenant?.name ?? 'tu centro'

  return (
    <>
      <Head title="Link de acceso" />
      <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col justify-center px-5 pb-32">
        <EmptyState icon={Link2Off} title={TITLES[reason]}>
          {`Pedile a ${center} un link nuevo y entrá desde ahí.`}
        </EmptyState>
      </main>
      <Dock withNav={false}>
        <WhatsappButton />
      </Dock>
    </>
  )
}
