import type { SVGProps } from 'react'

/**
 * WhatsApp glyph in the same line style as lucide (Píldora iconography).
 */
export function WhatsappIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19Z" />
      <path d="M9 9.5c.3 2.2 2.3 4.2 4.5 4.5l1-1.2 2 .9c-.2 1.2-1.2 1.8-2.3 1.8A6.3 6.3 0 0 1 7.5 9.3c0-1.1.6-2.1 1.8-2.3l.9 2Z" />
    </svg>
  )
}

function LineIcon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export function ClassesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="M4 5h16M4 12h16M4 19h10" />
      <circle cx="18" cy="19" r="2" />
    </LineIcon>
  )
}

export function PlanIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="M4 19V8l8-5 8 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <path d="M9 21v-7h6v7" />
    </LineIcon>
  )
}

export function PaymentsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M3 10h18M8 15h3" />
    </LineIcon>
  )
}
