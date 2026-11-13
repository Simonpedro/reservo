import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Button } from '~/components/ui/button'

/**
 * Confirmation sheet on a native modal <dialog>: focus trap, Esc and the
 * backdrop close it. The secondary action ("Mejor no") just closes and gets
 * the initial focus.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  action,
  dismissLabel = 'Mejor no',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: string
  action: ReactNode
  dismissLabel?: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const dismiss = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open && !element.open) {
      element.showModal()
      // Focus starts on the safe choice, so Enter never confirms by accident.
      dismiss.current?.focus()
    }
    if (!open && element.open) element.close()
  }, [open])

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    // Light dismiss: Esc and a tap on the backdrop close the sheet.
    element.setAttribute('closedby', 'any')
    if ('closedBy' in HTMLDialogElement.prototype) return
    // Light dismiss where `closedby` is not supported (Safari).
    const onClick = (event: MouseEvent) => {
      if (event.target !== element) return
      const box = element.getBoundingClientRect()
      const inside =
        box.top <= event.clientY &&
        event.clientY <= box.bottom &&
        box.left <= event.clientX &&
        event.clientX <= box.right
      if (!inside) element.close()
    }
    element.addEventListener('click', onClick)
    return () => element.removeEventListener('click', onClick)
  }, [])

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      className="bottom-sheet mx-auto mt-auto mb-0 w-full max-w-[430px] rounded-t-[34px] bg-white px-5 pt-6 pb-[30px] text-navy shadow-[0_-14px_34px_rgb(0_26_77/0.14)]"
    >
      <div
        aria-hidden="true"
        className="mx-auto -mt-2.5 mb-[18px] h-[5px] w-12 rounded-full bg-navy/20"
      />
      <h2 id={titleId} className="text-[22px] leading-[1.1] font-black tracking-[-0.04em]">
        {title}
      </h2>
      <p className="mt-[9px] text-base leading-[1.3] font-bold">{children}</p>
      <div className="mt-[18px] grid gap-1">
        {action}
        <form method="dialog" className="grid">
          <Button ref={dismiss} type="submit" variant="link">
            {dismissLabel}
          </Button>
        </form>
      </div>
    </dialog>
  )
}
