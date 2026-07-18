import { useState, type FormEvent } from 'react'
import { eventsApi } from '../../api/events'
import type { GatherEvent } from '../../types'
import { PaymentMethod, ManagerNotificationPreference } from '../../types'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
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
      <Card className="p-8">
        <h3 className="font-semibold text-gray-700 mb-4">פרטי האירוע</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p><span className="font-medium">שם:</span> {event.title}</p>
          {event.eventDate && <p><span className="font-medium">תאריך:</span> {new Date(event.eventDate).toLocaleDateString('he-IL')}</p>}
          {event.location && <p><span className="font-medium">מיקום:</span> {event.location}</p>}
          {event.customMessage && <p><span className="font-medium">הודעה:</span> {event.customMessage}</p>}
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Event edit form */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-700 mb-4">עריכת פרטי האירוע</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="שם האירוע *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="תאריך" type="date" value={form.eventDate} onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))} />
            <Input label="מיקום" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>
          <Input label="מחיר לאדם (₪)" type="number" min="0" value={form.pricePerParticipant}
            onChange={e => setForm(f => ({ ...f, pricePerParticipant: e.target.value }))} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">הודעה אישית</label>
            <textarea className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3} value={form.customMessage} onChange={e => setForm(f => ({ ...f, customMessage: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">תוכן הזמנה</label>
            <textarea className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={4} value={form.invitationContent} onChange={e => setForm(f => ({ ...f, invitationContent: e.target.value }))} />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">שיטת תשלום</label>
            <div className="flex gap-4">
              {[PaymentMethod.BankTransfer, PaymentMethod.Cash].map(m => (
                <label key={m} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={form.paymentMethod === m}
                    onChange={() => setForm(f => ({ ...f, paymentMethod: m }))} />
                  <span className="text-sm">{m === PaymentMethod.BankTransfer ? 'העברה בנקאית' : 'מזומן'}</span>
                </label>
              ))}
            </div>
            {form.paymentMethod === PaymentMethod.BankTransfer
              ? <Input className="mt-2" label="פרטי בנק" value={form.bankDetails} onChange={e => setForm(f => ({ ...f, bankDetails: e.target.value }))} />
              : <Input className="mt-2" label="שם איש קשר" value={form.cashContactName} onChange={e => setForm(f => ({ ...f, cashContactName: e.target.value }))} />
            }
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}
          <div className="flex justify-end">
            <Button type="submit" loading={editLoading}>שמור שינויים</Button>
          </div>
        </form>
      </Card>

      {/* Host & Managers */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-700 mb-4">צוות ניהול</h3>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">מארגן ראשי</span>
            <Button variant="ghost" onClick={() => setShowHost(true)}>עדכן</Button>
          </div>
          {event.host
            ? <p className="text-sm text-gray-700">{event.host.name} — {event.host.email}</p>
            : <p className="text-sm text-gray-400">לא הוגדר מארגן</p>
          }
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">מנהלים</span>
            <Button variant="ghost" onClick={() => setShowManager(true)}>+ הוסף</Button>
          </div>
          {(event.managers ?? []).length === 0
            ? <p className="text-sm text-gray-400">אין מנהלים</p>
            : (event.managers ?? []).map(m => (
              <div key={m.id} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-700">{m.name} — {m.email}</span>
                <button onClick={() => removeManager(m.id)} className="text-xs text-red-400 hover:text-red-600">הסר</button>
              </div>
            ))
          }
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-6">
        <h3 className="font-semibold text-gray-700 mb-4">התראות</h3>

        {/* Manager notification prefs */}
        {event.managers.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-600 mb-3">העדפות התראות מנהלים</p>
            <div className="space-y-3">
              {event.managers.map(manager => (
                <div key={manager.id} className="border rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">{manager.name}</p>
                  <div className="flex flex-wrap gap-4">
                    {([
                      { flag: ManagerNotificationPreference.RsvpReceived,    label: 'אישור הגעה' },
                      { flag: ManagerNotificationPreference.PaymentReceived, label: 'תשלום' },
                      { flag: ManagerNotificationPreference.VoteSubmitted,   label: 'הצבעה בסקר' },
                    ] as const).map(({ flag, label }) => (
                      <label key={flag} className="flex items-center gap-2 cursor-pointer text-sm">
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
                              setLocalManagerPrefs(p => ({ ...p, [manager.id]: current })) // rollback
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
          </div>
        )}

        <Button variant="secondary" onClick={() => setShowSendUpdate(true)}>שלח עדכון לכל המשתתפים</Button>
      </Card>

      {/* Modals */}
      {showHost && (
        <Modal title="עדכון מארגן ראשי" onClose={() => setShowHost(false)}>
          <div className="space-y-4">
            <Input label="שם *" value={hostForm.name} onChange={e => setHostForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            <Input label="אימייל *" type="email" value={hostForm.email} onChange={e => setHostForm(f => ({ ...f, email: e.target.value }))} />
            <Input label="תעודת זהות" value={hostForm.idNumber} onChange={e => setHostForm(f => ({ ...f, idNumber: e.target.value }))} />
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowHost(false)}>ביטול</Button>
              <Button onClick={setHost}>שמור</Button>
            </div>
          </div>
        </Modal>
      )}

      {showManager && (
        <Modal title="הוספת מנהל" onClose={() => setShowManager(false)}>
          <div className="space-y-4">
            <Input label="שם *" value={managerForm.name} onChange={e => setManagerForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            <Input label="אימייל *" type="email" value={managerForm.email} onChange={e => setManagerForm(f => ({ ...f, email: e.target.value }))} />
            <Input label="תעודת זהות" value={managerForm.idNumber} onChange={e => setManagerForm(f => ({ ...f, idNumber: e.target.value }))} />
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowManager(false)}>ביטול</Button>
              <Button onClick={addManager}>הוסף</Button>
            </div>
          </div>
        </Modal>
      )}

      {showSendUpdate && (
        <Modal title="שלח עדכון למשתתפים" onClose={() => setShowSendUpdate(false)}>
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">תוכן ההודעה</label>
              <textarea className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={5} value={updateMsg} onChange={e => setUpdateMsg(e.target.value)} autoFocus />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowSendUpdate(false)}>ביטול</Button>
              <Button onClick={sendUpdate} disabled={!updateMsg.trim()}>שלח</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
