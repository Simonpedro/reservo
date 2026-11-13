import { usePage } from '@inertiajs/react'
import { WhatsappIcon } from '~/components/icons'
import { Button } from '~/components/ui/button'
import type { PageProps } from '~/types'

export function whatsappUrl(phone: string | null | undefined) {
  const digits = phone?.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : null
}

/**
 * The tenant's WhatsApp link and name. `href` is null while the tenant has no
 * WhatsApp number configured.
 */
export function useTenantWhatsapp() {
  const { tenant } = usePage<PageProps>().props
  return { href: whatsappUrl(tenant?.whatsappPhone), center: tenant?.name ?? 'tu centro' }
}

/**
 * "Escribir a <tenant>" over WhatsApp. Renders nothing if the tenant has no
 * WhatsApp number configured.
 */
export function WhatsappButton({ variant = 'default' }: { variant?: 'default' | 'link' }) {
  const { href, center } = useTenantWhatsapp()
  if (!href) return null

  return (
    <Button asChild variant={variant}>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <WhatsappIcon />
        Escribir a {center}
      </a>
    </Button>
  )
}
