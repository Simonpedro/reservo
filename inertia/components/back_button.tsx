import { Link } from '@adonisjs/inertia/react'
import { ChevronLeft } from 'lucide-react'

/**
 * Inner pages hide the tab bar and the avatar and only show this button.
 */
export function BackButton({
  href,
  viewTransition = false,
}: {
  href: string
  viewTransition?: boolean
}) {
  return (
    <Link
      href={href}
      viewTransition={viewTransition}
      aria-label="Volver"
      className="relative z-[5] grid size-12 shrink-0 place-items-center rounded-full bg-white text-navy shadow-[0_7px_18px_rgb(0_26_77/0.14)]"
    >
      <ChevronLeft className="size-[22px]" strokeWidth={2.4} aria-hidden="true" />
    </Link>
  )
}
