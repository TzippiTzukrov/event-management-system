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

const statusClass: Record<EventStatus, string> = {
  [EventStatus.Draft]:           'badge--draft',
  [EventStatus.PollOpen]:        'badge--poll-open',
  [EventStatus.PollClosed]:      'badge--poll-closed',
  [EventStatus.InvitationsSent]: 'badge--invitations',
  [EventStatus.Active]:          'badge--active',
  [EventStatus.Completed]:       'badge--completed',
  [EventStatus.Cancelled]:       'badge--cancelled',
}

const roleLabels: Record<UserRole, string> = {
  [UserRole.Admin]:       'מנהל מערכת',
  [UserRole.Manager]:     'מנהל אירוע',
  [UserRole.Host]:        'בעל אירוע',
  [UserRole.Participant]: 'משתתף',
}

const roleClass: Record<UserRole, string> = {
  [UserRole.Admin]:       'badge--role-admin',
  [UserRole.Manager]:     'badge--role-manager',
  [UserRole.Host]:        'badge--role-host',
  [UserRole.Participant]: 'badge--role-participant',
}

export function StatusBadge({ status }: { status: EventStatus }) {
  return <span className={`badge ${statusClass[status]}`}>{statusLabels[status]}</span>
}

export function RoleBadge({ role }: { role: UserRole | string }) {
  const r = typeof role === 'string' ? (UserRole[role as keyof typeof UserRole] ?? UserRole.Participant) : role
  return <span className={`badge ${roleClass[r]}`}>{roleLabels[r]}</span>
}

export function Badge({ children, variant = 'default' }: { children: React.ReactNode; className?: string; variant?: 'default' | 'open' | 'closed' }) {
  const variantClass = variant === 'open' ? 'badge--open' : variant === 'closed' ? 'badge--closed' : 'badge--draft'
  return <span className={`badge ${variantClass}`}>{children}</span>
}
