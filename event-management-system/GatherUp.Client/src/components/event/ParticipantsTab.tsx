import { useState } from 'react'
import { eventsApi } from '../../api/events'
import { usersApi } from '../../api/users'
import type { GatherEvent, Participant } from '../../types'
import { NotificationPreference } from '../../types'
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

  // המשתתף המחובר — מזוהה לפי AppUserId קודם, אחרי כן לפי email
  const currentParticipant = participants.find(
    p => (userId && p.appUserId === userId) ||
         p.email?.toLowerCase() === username?.toLowerCase()
  )

  const effectiveNotifPrefs = localNotifPrefs ?? currentParticipant?.notificationPreferences ?? 0

  async function handleAdd() {
    setError('')
    setAddLoading(true)
    try {
      const added = await eventsApi.addParticipant(event.id, form)

      let temporaryPassword: string | null = null
      let alreadyHadAccount = false
      try {
        const res = await usersApi.create({ username: form.email, role: 'User', email: form.email })
        temporaryPassword = res.temporaryPassword
      } catch {
        alreadyHadAccount = true
      }

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
      {/* סטטיסטיקות + כפתורות */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-3 text-sm flex-wrap">
          <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full">✓ מגיעים: {attending}</span>
          <span className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full">? ממתין: {notAnswered}</span>
          <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full">💳 שילמו: {paid}</span>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <Button variant="secondary" onClick={sendReminders}>שלח תזכורות תשלום</Button>
          )}
          {canManage && (
            <Button onClick={() => setShowAdd(true)}>+ הוסף משתתף</Button>
          )}
        </div>
      </div>

      {/* כרטיס אישור הגעה עצמי — למשתמש שהוא משתתף */}
      {!canManage && currentParticipant && (
        <Card className="p-5 mb-4 border-indigo-100 bg-indigo-50">
          <p className="text-sm font-medium text-indigo-800 mb-3">
            הגעתך לאירוע — {currentParticipant.name}
          </p>
          <div className="flex gap-3">
            <Button
              onClick={() => updateRsvp(currentParticipant.id, true)}
              loading={rsvpLoading === currentParticipant.id}
              className={currentParticipant.isAttending === true ? 'ring-2 ring-green-400' : ''}
            >
              ✓ אני מגיע/ה
            </Button>
            <Button
              variant="secondary"
              onClick={() => updateRsvp(currentParticipant.id, false)}
              loading={rsvpLoading === currentParticipant.id}
              className={currentParticipant.isAttending === false ? 'ring-2 ring-red-400' : ''}
            >
              ✗ לא אגיע
            </Button>
          </div>
          {currentParticipant.isAttending === true && (
            <p className="text-xs text-green-700 mt-2">✓ אישרת הגעה</p>
          )}
          {currentParticipant.isAttending === false && (
            <p className="text-xs text-red-600 mt-2">✗ ציינת שלא תגיע</p>
          )}

          {/* העדפות התראות */}
          <div className="mt-4 pt-4 border-t border-indigo-200">
            <p className="text-xs font-medium text-indigo-700 mb-2">קבל התראות במייל:</p>
            <div className="flex flex-wrap gap-4">
              {([
                { flag: NotificationPreference.EventChanges,   label: 'שינויים באירוע' },
                { flag: NotificationPreference.NewPolls,       label: 'סקר חדש' },
              ] as const).map(({ flag, label }) => (
                <label key={flag} className="flex items-center gap-2 cursor-pointer text-xs text-indigo-800">
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
                        setLocalNotifPrefs(effectiveNotifPrefs) // rollback
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
        <Card className="p-10 text-center text-gray-400">אין משתתפים עדיין</Card>
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-500 text-right">
                <th className="px-4 py-3 font-medium">שם</th>
                <th className="px-4 py-3 font-medium">אימייל</th>
                <th className="px-4 py-3 font-medium">הגעה</th>
                <th className="px-4 py-3 font-medium">תשלום</th>
                {canManage && <th className="px-4 py-3 font-medium">פעולות</th>}
              </tr>
            </thead>
            <tbody>
              {participants.map(p => (
                <tr key={p.id} className={`border-b last:border-0 hover:bg-gray-50 ${p.id === currentParticipant?.id ? 'bg-indigo-50/40' : ''}`}>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {p.name}
                    {p.id === currentParticipant?.id && (
                      <span className="mr-1 text-xs text-indigo-500">(את/ה)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.email}</td>
                  <td className="px-4 py-3">
                    {p.isAttending === true && <span className="text-green-600 font-medium">✓ מגיע</span>}
                    {p.isAttending === false && <span className="text-red-500">✗ לא מגיע</span>}
                    {(p.isAttending === null || p.isAttending === undefined) && <span className="text-gray-400">טרם ענה</span>}
                  </td>
                  <td className="px-4 py-3">
                    {p.hasPaid
                      ? <span className="text-green-600">✓ שילם {p.amountPaid > 0 ? `₪${p.amountPaid}` : ''}</span>
                      : <span className="text-gray-400">טרם שילם</span>
                    }
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {p.isAttending !== true && (
                          <button
                            onClick={() => updateRsvp(p.id, true)}
                            disabled={rsvpLoading === p.id}
                            className="text-xs text-green-600 hover:underline disabled:opacity-50"
                          >
                            מגיע
                          </button>
                        )}
                        {p.isAttending !== false && (
                          <button
                            onClick={() => updateRsvp(p.id, false)}
                            disabled={rsvpLoading === p.id}
                            className="text-xs text-red-500 hover:underline disabled:opacity-50"
                          >
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
        </Card>
      )}

      {/* מודל הוספת משתתף (Admin בלבד) */}
      {showAdd && (
        <Modal title="הוספת משתתף" onClose={() => { setShowAdd(false); setError('') }}>
          <div className="space-y-4">
            <Input label="שם *" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required autoFocus />
            <Input label="אימייל *" type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required />
            <Input label="תעודת זהות" value={form.idNumber}
              onChange={e => setForm(f => ({ ...f, idNumber: e.target.value }))} />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" onClick={() => { setShowAdd(false); setError('') }}>ביטול</Button>
              <Button onClick={handleAdd} loading={addLoading}
                disabled={!form.name.trim() || !form.email.trim()}>
                הוסף
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* מודל אישור הוספה + סיסמה */}
      {addedResult && (
        <Modal title="✅ משתתף נוסף בהצלחה" onClose={() => setAddedResult(null)}>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-gray-700 space-y-1">
              <p><span className="font-medium">שם:</span> {addedResult.participant.name}</p>
              <p><span className="font-medium">אימייל:</span> {addedResult.participant.email}</p>
            </div>

            {addedResult.alreadyHadAccount ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                ℹ️ לאימייל זה כבר קיים חשבון במערכת — המשתתף יוכל להתחבר עם הסיסמה הקיימת שלו.
              </div>
            ) : addedResult.temporaryPassword ? (
              <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4">
                <p className="text-xs text-yellow-700 font-medium mb-2">
                  ⚠️ הסיסמה מוצגת פעם אחת בלבד — העתיקי אותה עכשיו
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  שם משתמש להתחברות: <strong>{addedResult.participant.email}</strong>
                </p>
                <div className="flex items-center gap-3">
                  <code className="text-xl font-bold tracking-widest text-gray-800 flex-1 select-all">
                    {addedResult.temporaryPassword}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(addedResult.temporaryPassword!)}
                    className="text-xs bg-white border border-gray-300 rounded px-2 py-1 hover:bg-gray-50 shrink-0">
                    העתק
                  </button>
                </div>
              </div>
            ) : null}

            <Button className="w-full justify-center" onClick={() => setAddedResult(null)}>
              הבנתי, סגור
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
