import { useState } from 'react'
import { eventsApi } from '../../api/events'
import { usersApi } from '../../api/users'
import type { GatherEvent, Participant } from '../../types'
import { NotificationPreference, UserRole } from '../../types'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { useAuth } from '../../context/AuthContext'

interface Props { event: GatherEvent; onReload: () => void }

interface AddedResult {
  participant: Participant
  temporaryPassword: string | null
  alreadyHadAccount: boolean
}

export function ParticipantsTab({ event, onReload }: Props) {
  const { canManage, userId, username } = useAuth()
  const [showAdd, setShowAdd] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', idNumber: '' })
  const [addedResult, setAddedResult] = useState<AddedResult | null>(null)
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null)
  const [notifLoading, setNotifLoading] = useState(false)
  const [localNotifPrefs, setLocalNotifPrefs] = useState<NotificationPreference | null>(null)

  const participants: Participant[] = event.participants ?? []

  const currentParticipant = participants.find(
    p => (userId && p.appUserId === userId) ||
         p.email?.toLowerCase() === username?.toLowerCase()
  )

  const effectiveNotifPrefs = localNotifPrefs ?? currentParticipant?.notificationPreferences ?? 0

  async function handleAdd() {
    setError('')
    setAddLoading(true)
    try {
      let temporaryPassword: string | null = null
      let alreadyHadAccount = false
      let appUserId: string | undefined

      try {
        const res = await usersApi.create({ username: form.email, role: UserRole.Participant, email: form.email })
        temporaryPassword = res.temporaryPassword
        appUserId = res.id
      } catch (err) {
        const status = (err as { status?: number })?.status
        if (status === 409 || status === 400) {
          alreadyHadAccount = true
        } else {
          throw err
        }
      }

      const added = await eventsApi.addParticipant(event.id, { ...form, appUserId })

      setShowAdd(false)
      setForm({ name: '', email: '', idNumber: '' })
      onReload()
      setAddedResult({ participant: added, temporaryPassword, alreadyHadAccount })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה')
    } finally {
      setAddLoading(false)
    }
  }

  async function updateRsvp(participantId: string, isAttending: boolean) {
    setRsvpLoading(participantId)
    try {
      await eventsApi.updateRsvp(event.id, participantId, isAttending)
      onReload()
    } finally {
      setRsvpLoading(null)
    }
  }

  async function sendReminders() {
    await eventsApi.sendPaymentReminders(event.id)
    alert('תזכורות תשלום נשלחו!')
  }

  const attending = participants.filter(p => p.isAttending === true).length
  const notAnswered = participants.filter(p => p.isAttending === null || p.isAttending === undefined).length
  const paid = participants.filter(p => p.hasPaid).length

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div className="stats-row">
          <span className="stat-pill stat-pill--success">מגיעים: {attending}</span>
          <span className="stat-pill stat-pill--warning">ממתין: {notAnswered}</span>
          <span className="stat-pill stat-pill--info">שילמו: {paid}</span>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <Button variant="secondary" onClick={sendReminders}>שלח תזכורות תשלום</Button>
          )}
          {canManage && (
            <Button onClick={() => setShowAdd(true)}>הוסף משתתף</Button>
          )}
        </div>
      </div>

      {!canManage && currentParticipant && (
        <Card highlight className="card-body mb-4">
          <p className="card-title mb-4">הגעתך לאירוע — {currentParticipant.name}</p>
          <div className="flex gap-3">
            <Button
              onClick={() => updateRsvp(currentParticipant.id, true)}
              loading={rsvpLoading === currentParticipant.id}
              className={currentParticipant.isAttending === true ? 'btn--selected-yes' : ''}
            >
              אני מגיע/ה
            </Button>
            <Button
              variant="secondary"
              onClick={() => updateRsvp(currentParticipant.id, false)}
              loading={rsvpLoading === currentParticipant.id}
              className={currentParticipant.isAttending === false ? 'btn--selected-no' : ''}
            >
              לא אגיע
            </Button>
          </div>
          {currentParticipant.isAttending === true && (
            <p className="text-sm text-success mt-4">אישרת הגעה</p>
          )}
          {currentParticipant.isAttending === false && (
            <p className="text-sm text-danger mt-4">ציינת שלא תגיע</p>
          )}

          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted mb-4">קבל התראות במייל:</p>
            <div className="checkbox-group">
              {([
                { flag: NotificationPreference.EventChanges, label: 'שינויים באירוע' },
                { flag: NotificationPreference.NewPolls,     label: 'סקר חדש' },
              ] as const).map(({ flag, label }) => (
                <label key={flag} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={!!(effectiveNotifPrefs & flag)}
                    disabled={notifLoading}
                    onChange={async () => {
                      const newPref = (effectiveNotifPrefs ^ flag) as NotificationPreference
                      setLocalNotifPrefs(newPref)
                      setNotifLoading(true)
                      try {
                        await eventsApi.updateParticipantNotifications(event.id, currentParticipant.id, newPref)
                        onReload()
                      } catch {
                        setLocalNotifPrefs(effectiveNotifPrefs)
                      } finally {
                        setNotifLoading(false)
                      }
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </Card>
      )}

      {participants.length === 0 ? (
        <Card><div className="empty-state">אין משתתפים עדיין</div></Card>
      ) : (
        <Card>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>שם</th>
                  <th>אימייל</th>
                  <th>הגעה</th>
                  <th>תשלום</th>
                  {canManage && <th>פעולות</th>}
                </tr>
              </thead>
              <tbody>
                {participants.map(p => (
                  <tr key={p.id} className={p.id === currentParticipant?.id ? 'row-highlight' : ''}>
                    <td className="cell-primary">
                      {p.name}
                      {p.id === currentParticipant?.id && (
                        <span className="text-muted text-sm"> (את/ה)</span>
                      )}
                    </td>
                    <td>{p.email}</td>
                    <td>
                      {p.isAttending === true && <span className="text-success">מגיע</span>}
                      {p.isAttending === false && <span className="text-danger">לא מגיע</span>}
                      {(p.isAttending === null || p.isAttending === undefined) && <span className="text-muted">טרם ענה</span>}
                    </td>
                    <td>
                      {p.hasPaid
                        ? <span className="text-success">שילם {p.amountPaid > 0 ? `₪${p.amountPaid}` : ''}</span>
                        : <span className="text-muted">טרם שילם</span>
                      }
                    </td>
                    {canManage && (
                      <td>
                        <div className="flex gap-2">
                          {p.isAttending !== true && (
                            <button type="button" className="table-action table-action--success"
                              onClick={() => updateRsvp(p.id, true)} disabled={rsvpLoading === p.id}>
                              מגיע
                            </button>
                          )}
                          {p.isAttending !== false && (
                            <button type="button" className="table-action table-action--danger"
                              onClick={() => updateRsvp(p.id, false)} disabled={rsvpLoading === p.id}>
                              לא מגיע
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showAdd && (
        <Modal title="הוספת משתתף" onClose={() => { setShowAdd(false); setError('') }}>
          <div className="form-stack">
            <Input label="שם *" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required autoFocus />
            <Input label="אימייל *" type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required />
            <Input label="תעודת זהות" value={form.idNumber}
              onChange={e => setForm(f => ({ ...f, idNumber: e.target.value }))} />
            {error && <div className="alert alert--error">{error}</div>}
            <div className="form-actions">
              <Button variant="secondary" onClick={() => { setShowAdd(false); setError('') }}>ביטול</Button>
              <Button onClick={handleAdd} loading={addLoading}
                disabled={!form.name.trim() || !form.email.trim()}>
                הוסף
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {addedResult && (
        <Modal title="משתתף נוסף בהצלחה" onClose={() => setAddedResult(null)}>
          <div className="form-stack">
            <div className="notice-box notice-box--success">
              <p><strong>שם:</strong> {addedResult.participant.name}</p>
              <p><strong>אימייל:</strong> {addedResult.participant.email}</p>
            </div>

            {addedResult.alreadyHadAccount ? (
              <div className="notice-box notice-box--info">
                לאימייל זה כבר קיים חשבון במערכת — המשתתף יוכל להתחבר עם הסיסמה הקיימת שלו.
              </div>
            ) : addedResult.temporaryPassword ? (
              <div className="notice-box notice-box--warning">
                <p className="text-sm mb-4">הסיסמה מוצגת פעם אחת בלבד — העתיקי אותה עכשיו</p>
                <p className="text-sm text-muted mb-4">
                  שם משתמש להתחברות: <strong>{addedResult.participant.email}</strong>
                </p>
                <div className="password-display">
                  <code>{addedResult.temporaryPassword}</code>
                  <Button size="sm" variant="secondary"
                    onClick={() => navigator.clipboard.writeText(addedResult.temporaryPassword!)}>
                    העתק
                  </Button>
                </div>
              </div>
            ) : null}

            <Button fullWidth onClick={() => setAddedResult(null)}>הבנתי, סגור</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
