import { CalendarOff, Clock, MapPin, Users } from 'lucide-react'
import type { AdminSessionCard as AdminSessionCardData } from '#services/admin_classes'
import { ClassCard } from '~/components/class_card'
import { DetailLine } from '~/components/info_line'

/**
 * The shared ClassCard with the admin's lines: time and instructor, center
 * and how many places are taken (or why the class is suspended).
 */
export function AdminSessionCard({ card }: { card: AdminSessionCardData }) {
  return (
    <ClassCard
      card={card}
      href={`/admin/clases/${card.sessionId}`}
      returnKey={`admin-session-${card.sessionId}`}
      lines={
        <>
          <DetailLine icon={Clock}>{`${card.startTime} · ${card.instructorName}`}</DetailLine>
          <DetailLine icon={MapPin}>{card.centerName}</DetailLine>
          {card.suspended ? (
            <DetailLine icon={CalendarOff}>
              {`Suspendida · ${card.suspensionReason ?? 'Sin clase'}`}
            </DetailLine>
          ) : (
            <DetailLine icon={Users}>{`${card.taken} de ${card.capacity} lugares`}</DetailLine>
          )}
        </>
      }
    />
  )
}
