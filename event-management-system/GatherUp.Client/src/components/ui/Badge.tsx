import { EventStatus, UserRole } from '../../types'

const statusColors: Record<EventStatus, string> = {
  [EventStatus.Draft]:           'bg-gray-100 text-gray-600 border-gray-200',
  [EventStatus.PollOpen]:        'bg-blue-50 text-blue-700 border-blue-200',
  [EventStatus.PollClosed]:      'bg-amber-50 text-amber-700 border-amber-200',
  [EventStatus.InvitationsSent]: 'bg-purple-50 text-purple-700 border-purple-200',
  [EventStatus.Active]:          'bg-emerald-50 text-emerald-700 border-emerald-200',
  [EventStatus.Completed]:       'bg-teal-50 text-teal-700 border-teal-200',
  [EventStatus.Cancelled]:       'bg-red-50 text-red-600 border-red-200',
}

const statusLabels: Record<EventStatus, string> = {
  [EventStatus.Draft]:           '● טיוטה',
  [EventStatus.PollOpen]:        '● סקר פתוח',
  [EventStatus.PollClosed]:      '● סקר סגור',
  [EventStatus.InvitationsSent]: '● הזמנות נשלחו',
  [EventStatus.Active]:          '● פעיל',
  [EventStatus.Completed]:       '✓ הסתיים',
  [EventStatus.Cancelled]:       '✕ בוטל',
}

const roleColors: Record<UserRole, string> = {
  [UserRole.Admin]:       'bg-violet-100 text-violet-700 border-violet-200',
  [UserRole.Manager]:     'bg-indigo-100 text-indigo-700 border-indigo-200',
  [UserRole.Host]:        'bg-amber-100 text-amber-700 border-amber-200',
  [UserRole.Participant]: 'bg-gray-100 text-gray-600 border-gray-200',
}

const roleLabels: Record<UserRole, string> = {
  [UserRole.Admin]:       '👑 מנהל מערכת',
  [UserRole.Manager]:     '🎯 מנהל אירוע',
  [UserRole.Host]:        '🎂 בעל אירוע',
  [UserRole.Participant]: '👤 משתתף',
}

export function StatusBadge({ status }: { status: EventStatus }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[status]}`}>
      {statusLabels[status]}
    </span>
  )
}

export function RoleBadge({ role }: { role: UserRole | string }) {
  const r = typeof role === 'string' ? (UserRole[role as keyof typeof UserRole] ?? UserRole.Participant) : role
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${roleColors[r]}`}>
      {roleLabels[r]}
    </span>
  )
}

export function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${className}`}>
      {children}
    </span>
  )
}
