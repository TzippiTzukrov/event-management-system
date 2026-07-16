import { api } from './client'
import type {
  GatherEvent,
  EventHost,
  EventManager,
  Participant,
  Poll,
  VendorAllocation,
  PaymentRequest,
  VoteRequest,
  EventStatus,
  ManagerNotificationPreference,
  NotificationPreference,
} from '../types'

const base = (id?: string) => `/events${id ? `/${id}` : ''}`

export const eventsApi = {
  // ── Events ────────────────────────────────────────────────
  getAll: () => api.get<GatherEvent[]>(base()),
  getById: (id: string) => api.get<GatherEvent>(base(id)),
  create: (event: Partial<GatherEvent>) => api.post<GatherEvent>(base(), event),
  update: (id: string, event: Partial<GatherEvent>) => api.put<GatherEvent>(base(id), event),
  delete: (id: string) => api.delete<void>(base(id)),
  updateStatus: (id: string, status: EventStatus) =>
    api.patch<void>(`${base(id)}/status`, status),

  // ── Persons ───────────────────────────────────────────────
  setHost: (eventId: string, host: Partial<EventHost>) =>
    api.put<EventHost>(`${base(eventId)}/persons/host`, host),
  addManager: (eventId: string, manager: Partial<EventManager>) =>
    api.post<EventManager>(`${base(eventId)}/persons/managers`, manager),
  removeManager: (eventId: string, managerId: string) =>
    api.delete<void>(`${base(eventId)}/persons/managers/${managerId}`),
  updateManagerNotifications: (eventId: string, managerId: string, prefs: ManagerNotificationPreference) =>
    api.patch<void>(`${base(eventId)}/persons/managers/${managerId}/notifications`, prefs),

  // ── Participants ──────────────────────────────────────────
  getParticipants: (eventId: string) =>
    api.get<Participant[]>(`${base(eventId)}/participants`),
  addParticipant: (eventId: string, p: Partial<Participant>) =>
    api.post<Participant>(`${base(eventId)}/participants`, p),
  updateRsvp: (eventId: string, participantId: string, isAttending: boolean) =>
    api.patch<void>(`${base(eventId)}/participants/${participantId}/rsvp`, isAttending),
  updateParticipantNotifications: (eventId: string, participantId: string, prefs: NotificationPreference) =>
    api.patch<void>(`${base(eventId)}/participants/${participantId}/notifications`, prefs),
  sendPaymentReminders: (eventId: string) =>
    api.post<void>(`${base(eventId)}/participants/send-payment-reminders`),

  // ── Financial ─────────────────────────────────────────────
  getVendors: (eventId: string) =>
    api.get<VendorAllocation[]>(`${base(eventId)}/financial/vendors`),
  addVendor: (eventId: string, vendor: Partial<VendorAllocation>) =>
    api.post<VendorAllocation>(`${base(eventId)}/financial/vendors`, vendor),
  deleteVendor: (eventId: string, vendorId: string) =>
    api.delete<void>(`${base(eventId)}/financial/vendors/${vendorId}`),
  markPayment: (eventId: string, participantId: string, req: PaymentRequest) =>
    api.post<void>(`${base(eventId)}/financial/payments/${participantId}`, req),

  // ── Polls ─────────────────────────────────────────────────
  getPolls: (eventId: string) =>
    api.get<Poll[]>(`${base(eventId)}/polls`),
  createPoll: (eventId: string, poll: Partial<Poll>) =>
    api.post<Poll>(`${base(eventId)}/polls`, poll),
  vote: (eventId: string, pollId: string, questionId: string, req: VoteRequest) =>
    api.post<void>(`${base(eventId)}/polls/${pollId}/questions/${questionId}/vote`, req),
  getResults: (eventId: string, pollId: string, questionId: string) =>
    api.get<Record<string, number>>(`${base(eventId)}/polls/${pollId}/questions/${questionId}/results`),

  // ── Notifications ─────────────────────────────────────────
  sendInvitations: (eventId: string) =>
    api.post<void>(`${base(eventId)}/send-invitations`),
  sendUpdate: (eventId: string, message: string) =>
    api.post<void>(`${base(eventId)}/send-update`, message),
}
