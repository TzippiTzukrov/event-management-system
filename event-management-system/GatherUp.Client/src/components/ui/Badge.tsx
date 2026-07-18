import { EventStatus, UserRole } from '../../types'

const statusLabels: Record<EventStatus, string> = {
  [EventStatus.Draft]:           'טיוטה',
  [EventStatus.PollOpen]:        'סקר פתוח',
  [EventStatus.PollClosed]:      'סקר סגור',
  [EventStatus.InvitationsSent]: 'הזמנות נשלחו',
  [EventStatus.Active]:          'פעיל',
  [EventStatus.Completed]:       'הסתיים',
  [EventStatus.Cancelled]:       'בוטל',
}

const roleLabels: Record<UserRole, string> = {
  [UserRole.Admin]:       'מנהל מערכת',
  [UserRole.Manager]:     'מנהל אירוע',
  [UserRole.Host]:        'בעל אירוע',
  [UserRole.Participant]: 'משתתף',
}

export function StatusBadge({ status }: { status: EventStatus }) {
  return <span>{statusLabels[status]}</span>
}

export function RoleBadge({ role }: { role: UserRole | string }) {
  const r = typeof role === 'string' ? (UserRole[role as keyof typeof UserRole] ?? UserRole.Participant) : role
  return <span>{roleLabels[r]}</span>
}

export function Badge({ children }: { children: React.ReactNode; className?: string }) {
  return <span>{children}</span>
}
