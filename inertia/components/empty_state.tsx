import type { LucideIcon } from 'lucide-react'

export function EmptyState({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon
  title: string
  children: string
}) {
  return (
    <section className="flex flex-col items-center px-3 pt-10 pb-6 text-center">
      <div className="mb-4 grid size-16 place-items-center rounded-full bg-wash-celeste">
        <Icon className="size-[30px]" strokeWidth={2.2} aria-hidden="true" />
      </div>
      <h2 className="max-w-[290px] text-[22px] leading-[1.1] font-black tracking-[-0.04em]">
        {title}
      </h2>
      <p className="mt-2.5 max-w-[290px] text-base leading-[1.35] font-bold">{children}</p>
    </section>
  )
}
