import { usePage } from '@inertiajs/react'
import { WhatsappIcon } from '~/components/icons'
import { Button } from '~/components/ui/button'
import type { PageProps } from '~/types'

export function whatsappUrl(phone: string | null | undefined) {
  const digits = phone?.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : null
}

/**
 * "Escribir a <tenant>" over WhatsApp. Renders nothing if the tenant has no
 * WhatsApp number configured.
 */
export function WhatsappButton({ variant = 'default' }: { variant?: 'default' | 'link' }) {
  const { tenant } = usePage<PageProps>().props
  const href = whatsappUrl(tenant?.whatsappPhone)
  if (!href) return null

  return (
    <Button asChild variant={variant}>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <WhatsappIcon />
        Escribir a {tenant?.name}
      </a>
    </Button>
  )
}
