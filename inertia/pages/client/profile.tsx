import { Link } from '@adonisjs/inertia/react'
import { Head, usePage } from '@inertiajs/react'
import { Mail, Phone } from 'lucide-react'
import { BackButton } from '~/components/back_button'
import { Dock } from '~/components/client_layout'
import { InfoLine } from '~/components/info_line'
import { Button } from '~/components/ui/button'
import { useTenantWhatsapp, WhatsappButton } from '~/components/whatsapp_button'
import type { PageProps } from '~/types'

/**
 * Minimal profile (inner page): who is signed in and how to sign out.
 */
export default function Profile() {
  const { auth, tenant } = usePage<PageProps>().props
  const user = auth.user
  const center = tenant?.name ?? 'Kinaf'
  const whatsapp = useTenantWhatsapp()

  return (
    <>
      <Head title="Perfil" />
      <main className="mx-auto min-h-svh w-full max-w-[430px] px-5 pt-3 pb-44">
        <div className="mb-3 flex min-h-12 items-center">
          <BackButton href="/clases" />
        </div>
        <h1 className="text-[32px] leading-none font-black tracking-[-0.045em]">
          {user?.fullName}
        </h1>
        <div className="mt-5 grid gap-2.5">
          {user?.email && <InfoLine icon={Mail}>{user.email}</InfoLine>}
          {user?.phone && <InfoLine icon={Phone}>{user.phone}</InfoLine>}
        </div>
        <p className="mt-[18px] text-base leading-snug font-bold text-muted-foreground">
          {whatsapp.href
            ? `¿Necesitás cambiar algo de tu plan o avisar que no venís con menos de 24 h? Escribile a ${center}.`
            : `¿Necesitás cambiar algo de tu plan o avisar que no venís con menos de 24 h? Avisale a ${center} por WhatsApp o en recepción.`}
        </p>
        <Dock withNav={false}>
          <WhatsappButton />
          <Button asChild variant="link">
            <Link href="/logout" method="post" as="button">
              Cerrar sesión
            </Link>
          </Button>
        </Dock>
      </main>
    </>
  )
}
