import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { eventsApi } from '../api/events'
import { PaymentMethod } from '../types'
import { Input, Textarea } from '../components/ui/Input'
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
    <div className="page max-w-form">
      <div className="page-header">
        <div>
          <button type="button" className="back-link" style={{ marginBottom: '0.5rem' }} onClick={() => navigate(-1)}>
            ← חזרה
          </button>
          <h1 className="page-title">אירוע חדש</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="card-body form-section">
          <h2 className="card-section-title">פרטי האירוע</h2>
          <div className="form-stack">
            <Input label="שם האירוע *" value={form.title} onChange={e => set('title', e.target.value)} required />
            <div className="form-row-2">
              <Input label="תאריך" type="date" value={form.eventDate} onChange={e => set('eventDate', e.target.value)} />
              <Input label="מיקום" value={form.location} onChange={e => set('location', e.target.value)} />
            </div>
            <Input label="מחיר לאדם (₪)" type="number" min="0" value={form.pricePerParticipant}
              onChange={e => set('pricePerParticipant', e.target.value)} />
            <Textarea label="הודעה אישית" value={form.customMessage} onChange={e => set('customMessage', e.target.value)} />
          </div>
        </Card>

        <Card className="card-body form-section">
          <h2 className="card-section-title">תשלום</h2>
          <div className="form-stack">
            <div className="radio-group">
              {[PaymentMethod.BankTransfer, PaymentMethod.Cash].map(m => (
                <label key={m} className="radio-label">
                  <input type="radio" name="paymentMethod" value={m}
                    checked={form.paymentMethod === m}
                    onChange={() => set('paymentMethod', m)} />
                  {m === PaymentMethod.BankTransfer ? 'העברה בנקאית' : 'מזומן'}
                </label>
              ))}
            </div>
            {form.paymentMethod === PaymentMethod.BankTransfer
              ? <Input label="פרטי חשבון בנק" value={form.bankDetails} onChange={e => set('bankDetails', e.target.value)} />
              : <Input label="שם איש קשר לתשלום מזומן" value={form.cashContactName} onChange={e => set('cashContactName', e.target.value)} />
            }
          </div>
        </Card>

        <Card className="card-body form-section">
          <h2 className="card-section-title">הזמנה</h2>
          <Textarea
            label="תוכן ההזמנה"
            rows={4}
            value={form.invitationContent}
            onChange={e => set('invitationContent', e.target.value)}
            placeholder="תוכן ההודעה שתישלח למשתתפים..."
          />
        </Card>

        {error && <div className="alert alert--error">{error}</div>}

        <div className="form-actions">
          <Button variant="secondary" type="button" onClick={() => navigate(-1)}>ביטול</Button>
          <Button type="submit" loading={loading}>צור אירוע</Button>
        </div>
      </form>
    </div>
  )
}
