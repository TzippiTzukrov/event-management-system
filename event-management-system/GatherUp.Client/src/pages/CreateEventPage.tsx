import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { eventsApi } from '../api/events'
import { PaymentMethod } from '../types'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

export function CreateEventPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    eventDate: '',
    location: '',
    pricePerParticipant: '',
    customMessage: '',
    paymentMethod: PaymentMethod.BankTransfer,
    bankDetails: '',
    cashContactName: '',
    invitationContent: '',
  })

  function set(field: string, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const created = await eventsApi.create({
        ...form,
        pricePerParticipant: form.pricePerParticipant ? Number(form.pricePerParticipant) : undefined,
        eventDate: form.eventDate || undefined,
      })
      navigate(`/events/${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת האירוע')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 text-2xl">←</button>
        <h1 className="text-3xl font-bold text-gray-900">אירוע חדש</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-4 mb-4">
          <h2 className="font-semibold text-gray-700 mb-2">פרטי האירוע</h2>
          <Input label="שם האירוע *" value={form.title} onChange={e => set('title', e.target.value)} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="תאריך" type="date" value={form.eventDate} onChange={e => set('eventDate', e.target.value)} />
            <Input label="מיקום" value={form.location} onChange={e => set('location', e.target.value)} />
          </div>
          <Input label="מחיר לאדם (₪)" type="number" min="0" value={form.pricePerParticipant}
            onChange={e => set('pricePerParticipant', e.target.value)} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">הודעה אישית</label>
            <textarea
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3} value={form.customMessage} onChange={e => set('customMessage', e.target.value)}
            />
          </div>
        </Card>

        <Card className="p-6 space-y-4 mb-4">
          <h2 className="font-semibold text-gray-700 mb-2">תשלום</h2>
          <div className="flex gap-4">
            {[PaymentMethod.BankTransfer, PaymentMethod.Cash].map(m => (
              <label key={m} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="paymentMethod" value={m}
                  checked={form.paymentMethod === m}
                  onChange={() => set('paymentMethod', m)} />
                <span className="text-sm">{m === PaymentMethod.BankTransfer ? 'העברה בנקאית' : 'מזומן'}</span>
              </label>
            ))}
          </div>
          {form.paymentMethod === PaymentMethod.BankTransfer
            ? <Input label="פרטי חשבון בנק" value={form.bankDetails} onChange={e => set('bankDetails', e.target.value)} />
            : <Input label="שם איש קשר לתשלום מזומן" value={form.cashContactName} onChange={e => set('cashContactName', e.target.value)} />
          }
        </Card>

        <Card className="p-6 space-y-4 mb-6">
          <h2 className="font-semibold text-gray-700 mb-2">הזמנה</h2>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">תוכן ההזמנה</label>
            <textarea
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={4} value={form.invitationContent} onChange={e => set('invitationContent', e.target.value)}
              placeholder="תוכן ההודעה שתישלח למשתתפים..."
            />
          </div>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>
        )}

        <div className="flex gap-3 justify-end">
          <Button variant="secondary" type="button" onClick={() => navigate(-1)}>ביטול</Button>
          <Button type="submit" loading={loading}>צור אירוע</Button>
        </div>
      </form>
    </div>
  )
}
