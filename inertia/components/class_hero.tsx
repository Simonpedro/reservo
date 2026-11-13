import type { Ref } from 'react'
import type { ClassCardData } from '#services/my_classes'
import { BackButton } from '~/components/back_button'
import { heroCutoutClass, rememberReturn, TRANSITION_NAMES } from '~/components/class_card'
import { cn } from '~/lib/utils'

const WASH = {
  green: 'bg-wash-green',
  celeste: 'bg-wash-celeste',
  blue: 'bg-wash-blue',
} as const

/**
 * The top of a class detail: wash, back button, title and photo, sharing
 * view-transition names with the card it was opened from.
 */
export function ClassHero({
  activity,
  backHref,
  returnKey,
  muted = false,
  ref: heading,
}: {
  activity: ClassCardData['activity']
  backHref: string
  /**
   * The card to morph back into (see rememberReturn).
   */
  returnKey: string
  muted?: boolean
  ref?: Ref<HTMLHeadingElement>
}) {
  return (
    <article
      style={{ viewTransitionName: TRANSITION_NAMES.background }}
      className={cn(
        'relative isolate mb-2.5 min-h-[214px] overflow-visible rounded-[34px] px-4 pt-2 pb-5 text-navy',
        muted ? 'bg-wash-navy' : WASH[activity.wash]
      )}
    >
      <div onClickCapture={() => rememberReturn(returnKey)}>
        <BackButton href={backHref} viewTransition />
      </div>
      <h1
        ref={heading}
        tabIndex={-1}
        style={{ viewTransitionName: TRANSITION_NAMES.title }}
        className="mt-[18px] w-fit max-w-[calc(100%-150px)] text-[32px] leading-[0.95] font-black tracking-[-0.045em] outline-none"
      >
        {activity.name}
      </h1>
      {activity.image && (
        <img
          src={activity.image}
          alt=""
          style={{ viewTransitionName: TRANSITION_NAMES.photo }}
          className={cn(
            'pointer-events-none absolute z-[3] object-contain object-right-bottom drop-shadow-[0_12px_10px_rgb(0_26_77/0.14)]',
            heroCutoutClass(activity.image),
            muted && 'opacity-55 grayscale'
          )}
        />
      )}
    </article>
  )
}
