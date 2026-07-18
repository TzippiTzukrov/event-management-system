import { useState, type FormEvent } from 'react'
import { eventsApi } from '../../api/events'
import type { GatherEvent } from '../../types'
import { PaymentMethod, ManagerNotificationPreference } from '../../types'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input, Textarea } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { useAuth } from '../../context/AuthContext'

interface Props { event: GatherEvent; onReload: () => void }

export function SettingsTab({ event, onReload }: Props) {
  const { canManage } = useAuth()
  const [editLoading, setEditLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showHost, setShowHost] = useState(false)
  const [showManager, setShowManager] = useState(false)
  const [showSendUpdate, setShowSendUpdate] = useState(false)
  const [updateMsg, setUpdateMsg] = useState('')
  const [notifLoading, setNotifLoading] = useState(false)
  const [localManagerPrefs, setLocalManagerPrefs] = useState<Record<string, number>>({})

  const [form, setForm] = useState({
    title: event.title,
    eventDate: event.eventDate?.split('T')[0] ?? '',
    location: event.location ?? '',
    pricePerParticipant: event.pricePerParticipant?.toString() ?? '',
    customMessage: event.customMessage ?? '',
    paymentMethod: event.paymentMethod,
    bankDetails: event.bankDetails ?? '',
    cashContactName: event.cashContactName ?? '',
    invitationContent: event.invitationContent ?? '',
  })

  const [hostForm, setHostForm] = useState({ name: '', email: '', idNumber: '' })
  const [managerForm, setManagerForm] = useState({ name: '', email: '', idNumber: '' })

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setEditLoading(true)
    try {
      await eventsApi.update(event.id, {
        id: event.id,
        title: form.title,
        eventDate: form.eventDate || undefined,
        location: form.location || undefined,
        pricePerParticipant: form.pricePerParticipant ? Number(form.pricePerParticipant) : undefined,
        customMessage: form.customMessage || undefined,
        paymentMethod: form.paymentMethod,
        bankDetails: form.bankDetails || undefined,
        cashContactName: form.cashContactName || undefined,
        invitationContent: form.invitationContent,
      })
      setSuccess('השינויים נשמרו בהצלחה')
      onReload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה בשמירה')
    } finally {
      setEditLoading(false)
    }
  }

  async function setHost() {
    await eventsApi.setHost(event.id, hostForm)
    setShowHost(false)
    setHostForm({ name: '', email: '', idNumber: '' })
    onReload()
  }

  async function addManager() {
    await eventsApi.addManager(event.id, managerForm)
    setShowManager(false)
    setManagerForm({ name: '', email: '', idNumber: '' })
    onReload()
  }

  async function removeManager(managerId: string) {
    if (!confirm('להסיר מנהל?')) return
    await eventsApi.removeManager(event.id, managerId)
    onReload()
  }

  async function sendUpdate() {
    await eventsApi.sendUpdate(event.id, updateMsg)
    setShowSendUpdate(false)
    setUpdateMsg('')
    alert(`עדכון נשלח לכל ${event.participants?.length ?? 0} המשתתפים!`)
  }

  if (!canManage) {
    return (
      <Card className="card-body">
        <h3 className="card-section-title">פרטי האירוע</h3>
        <div className="detail-row">
          <span className="detail-label">שם</span>
          <span className="detail-value">{event.title}</span>
        </div>
        {event.eventDate && (
          <div className="detail-row">
            <span className="detail-label">תאריך</span>
            <span className="detail-value">{new Date(event.eventDate).toLocaleDateString('he-IL')}</span>
          </div>
        )}
        {event.location && (
          <div className="detail-row">
            <span className="detail-label">מיקום</span>
            <span className="detail-value">{event.location}</span>
          </div>
        )}
        {event.customMessage && (
          <div className="detail-row">
            <span className="detail-label">הודעה</span>
            <span className="detail-value">{event.customMessage}</span>
          </div>
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="card-body">
        <h3 className="card-section-title">עריכת פרטי האירוע</h3>
        <form onSubmit={handleSave} className="form-stack">
          <Input label="שם האירוע *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          <div className="form-row-2">
            <Input label="תאריך" type="date" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} />
            <Input label="מיקום" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>
          <Input label="מחיר לאדם (₪)" type="number" min="0" value={form.pricePerParticipant}
            onChange={e => setForm(f => ({ ...f, pricePerParticipant: e.target.value }))} />
          <Textarea label="הודעה אישית" value={form.customMessage}
            onChange={e => setForm(f => ({ ...f, customMessage: e.target.value }))} />
          <Textarea label="תוכן הזמנה" rows={4} value={form.invitationContent}
            onChange={e => setForm(f => ({ ...f, invitationContent: e.target.value }))} />

          <div>
            <label className="form-label">שיטת תשלום</label>
            <div className="radio-group mt-4">
              {[PaymentMethod.BankTransfer, PaymentMethod.Cash].map(m => (
                <label key={m} className="radio-label">
                  <input type="radio" checked={form.paymentMethod === m}
                    onChange={() => setForm(f => ({ ...f, paymentMethod: m }))} />
                  {m === PaymentMethod.BankTransfer ? 'העברה בנקאית' : 'מזומן'}
                </label>
              ))}
            </div>
            {form.paymentMethod === PaymentMethod.BankTransfer
              ? <Input className="mt-4" label="פרטי בנק" value={form.bankDetails} onChange={e => setForm(f => ({ ...f, bankDetails: e.target.value }))} />
              : <Input className="mt-4" label="שם איש קשר" value={form.cashContactName} onChange={e => setForm(f => ({ ...f, cashContactName: e.target.value }))} />
            }
          </div>

          {error && <div className="alert alert--error">{error}</div>}
          {success && <div className="alert alert--success">{success}</div>}
          <div className="form-actions">
            <Button type="submit" loading={editLoading}>שמור שינויים</Button>
          </div>
        </form>
      </Card>

      <Card className="card-body">
        <h3 className="card-section-title">צוות ניהול</h3>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-muted">מארגן ראשי</span>
            <Button variant="ghost" size="sm" onClick={() => setShowHost(true)}>עדכן</Button>
          </div>
          {event.host
            ? <p className="text-sm">{event.host.name} — {event.host.email}</p>
            : <p className="text-sm text-muted">לא הוגדר מארגן</p>
          }
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-muted">מנהלים</span>
            <Button variant="ghost" size="sm" onClick={() => setShowManager(true)}>הוסף</Button>
          </div>
          {(event.managers ?? []).length === 0
            ? <p className="text-sm text-muted">אין מנהלים</p>
            : (event.managers ?? []).map(m => (
              <div key={m.id} className="manager-row">
                <span className="text-sm">{m.name} — {m.email}</span>
                <button type="button" className="table-action table-action--danger" onClick={() => removeManager(m.id)}>הסר</button>
              </div>
            ))
          }
        </div>
      </Card>

      <Card className="card-body">
        <h3 className="card-section-title">התראות</h3>

        {event.managers.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-muted mb-4">העדפות התראות מנהלים</p>
            {event.managers.map(manager => (
              <div key={manager.id} className="manager-prefs-box">
                <p className="text-sm cell-primary mb-4">{manager.name}</p>
                <div className="checkbox-group">
                  {([
                    { flag: ManagerNotificationPreference.RsvpReceived,    label: 'אישור הגעה' },
                    { flag: ManagerNotificationPreference.PaymentReceived, label: 'תשלום' },
                    { flag: ManagerNotificationPreference.VoteSubmitted,   label: 'הצבעה בסקר' },
                  ] as const).map(({ flag, label }) => (
                    <label key={flag} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={!!((localManagerPrefs[manager.id] ?? manager.notificationPreferences) & flag)}
                        disabled={notifLoading}
                        onChange={async () => {
                          const current = (localManagerPrefs[manager.id] ?? manager.notificationPreferences) as ManagerNotificationPreference
                          const newPref = (current ^ flag) as ManagerNotificationPreference
                          setLocalManagerPrefs(p => ({ ...p, [manager.id]: newPref }))
                          setNotifLoading(true)
                          try {
                            await eventsApi.updateManagerNotifications(event.id, manager.id, newPref)
                            onReload()
                          } catch {
                            setLocalManagerPrefs(p => ({ ...p, [manager.id]: current }))
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
            ))}
          </div>
        )}

        <Button variant="secondary" onClick={() => setShowSendUpdate(true)}>שלח עדכון לכל המשתתפים</Button>
      </Card>

      {showHost && (
        <Modal title="עדכון מארגן ראשי" onClose={() => setShowHost(false)}>
          <div className="form-stack">
            <Input label="שם *" value={hostForm.name} onChange={e => setHostForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            <Input label="אימייל *" type="email" value={hostForm.email} onChange={e => setHostForm(f => ({ ...f, email: e.target.value }))} />
            <Input label="תעודת זהות" value={hostForm.idNumber} onChange={e => setHostForm(f => ({ ...f, idNumber: e.target.value }))} />
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setShowHost(false)}>ביטול</Button>
              <Button onClick={setHost}>שמור</Button>
            </div>
          </div>
        </Modal>
      )}

      {showManager && (
        <Modal title="הוספת מנהל" onClose={() => setShowManager(false)}>
          <div className="form-stack">
            <Input label="שם *" value={managerForm.name} onChange={e => setManagerForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            <Input label="אימייל *" type="email" value={managerForm.email} onChange={e => setManagerForm(f => ({ ...f, email: e.target.value }))} />
            <Input label="תעודת זהות" value={managerForm.idNumber} onChange={e => setManagerForm(f => ({ ...f, idNumber: e.target.value }))} />
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setShowManager(false)}>ביטול</Button>
              <Button onClick={addManager}>הוסף</Button>
            </div>
          </div>
        </Modal>
      )}

      {showSendUpdate && (
        <Modal title="שלח עדכון למשתתפים" onClose={() => setShowSendUpdate(false)}>
          <div className="form-stack">
            <Textarea label="תוכן ההודעה" rows={5} value={updateMsg}
              onChange={e => setUpdateMsg(e.target.value)} autoFocus />
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setShowSendUpdate(false)}>ביטול</Button>
              <Button onClick={sendUpdate} disabled={!updateMsg.trim()}>שלח</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
