import { useState } from 'react'
import { eventsApi } from '../../api/events'
import type { GatherEvent, Participant } from '../../types'
import { PaymentMethod, PaymentMethodLabels } from '../../types'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { useAuth } from '../../context/AuthContext'

interface Props { event: GatherEvent; onReload: () => void }

export function FinanceTab({ event, onReload }: Props) {
  const { canManage, username } = useAuth()
  const [showVendor, setShowVendor] = useState(false)
  const [showPayment, setShowPayment] = useState<Participant | null>(null)
  const [vendorForm, setVendorForm] = useState({ name: '', amountOwed: '' })
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: PaymentMethod.BankTransfer })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const vendors = event.vendors ?? []
  const participants = event.participants ?? []

  const currentParticipant = participants.find(
    p => p.email?.toLowerCase() === username?.toLowerCase() ||
         p.name?.toLowerCase() === username?.toLowerCase()
  )

  const totalCollected = participants.reduce((s, p) => s + (p.amountPaid ?? 0), 0)
  const totalVendors = vendors.reduce((s, v) => s + v.amountOwed, 0)

  async function addVendor() {
    setError('')
    setLoading(true)
    try {
      await eventsApi.addVendor(event.id, { name: vendorForm.name, amountOwed: Number(vendorForm.amountOwed) })
      setShowVendor(false)
      setVendorForm({ name: '', amountOwed: '' })
      onReload()
    } catch (e) { setError(e instanceof Error ? e.message : 'שגיאה') }
    finally { setLoading(false) }
  }

  async function deleteVendor(vendorId: string) {
    if (!confirm('למחוק ספק?')) return
    await eventsApi.deleteVendor(event.id, vendorId)
    onReload()
  }

  async function markPayment() {
    if (!showPayment) return
    setLoading(true)
    try {
      await eventsApi.markPayment(event.id, showPayment.id, {
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
      })
      setShowPayment(null)
      setPaymentForm({ amount: '', method: PaymentMethod.BankTransfer })
      onReload()
    } catch (e) { setError(e instanceof Error ? e.message : 'שגיאה') }
    finally { setLoading(false) }
  }

  if (!canManage) {
    if (!currentParticipant) {
      return <Card><div className="empty-state">אינך רשום/ה כמשתתף/ת באירוע זה</div></Card>
    }

    return (
      <Card className="card-body">
        <h3 className="card-section-title">מצב התשלום שלי</h3>
        <div className="detail-row">
          <span className="detail-label">סכום לתשלום</span>
          <span className="detail-value">
            {event.pricePerParticipant ? `₪${event.pricePerParticipant}` : 'לא הוגדר'}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">סטטוס תשלום</span>
          {currentParticipant.hasPaid
            ? <span className="text-success">שולם (₪{currentParticipant.amountPaid})</span>
            : <span className="text-danger">טרם שולם</span>
          }
        </div>
        {!currentParticipant.hasPaid && (
          <div className="detail-row">
            <span className="detail-label">אמצעי תשלום</span>
            <span className="detail-value">{PaymentMethodLabels[event.paymentMethod]}</span>
          </div>
        )}
        {!currentParticipant.hasPaid && event.paymentMethod === PaymentMethod.BankTransfer && event.bankDetails && (
          <div className="detail-row">
            <span className="detail-label">פרטי חשבון בנק</span>
            <span className="detail-value">{event.bankDetails}</span>
          </div>
        )}
        {!currentParticipant.hasPaid && event.paymentMethod === PaymentMethod.Cash && event.cashContactName && (
          <div className="detail-row">
            <span className="detail-label">תשלום מזומן אצל</span>
            <span className="detail-value">{event.cashContactName}</span>
          </div>
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="stats-grid">
        <Card className="stat-card">
          <p className="stat-card-label">נגבה</p>
          <p className="stat-card-value stat-card-value--success">₪{totalCollected.toLocaleString()}</p>
        </Card>
        <Card className="stat-card">
          <p className="stat-card-label">חובות לספקים</p>
          <p className="stat-card-value stat-card-value--danger">₪{totalVendors.toLocaleString()}</p>
        </Card>
        <Card className="stat-card">
          <p className="stat-card-label">יתרה</p>
          <p className={`stat-card-value ${totalCollected - totalVendors >= 0 ? 'stat-card-value--accent' : 'stat-card-value--danger'}`}>
            ₪{(totalCollected - totalVendors).toLocaleString()}
          </p>
        </Card>
      </div>

      <Card>
        <div className="card-header">
          <h3 className="card-title">תשלומי משתתפים</h3>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>שם</th>
                <th>סכום ששולם</th>
                <th>סטטוס</th>
                <th>פעולה</th>
              </tr>
            </thead>
            <tbody>
              {participants.map(p => (
                <tr key={p.id}>
                  <td className="cell-primary">{p.name}</td>
                  <td>₪{p.amountPaid ?? 0}</td>
                  <td>
                    {p.hasPaid
                      ? <span className="text-success">שולם</span>
                      : <span className="text-muted">ממתין</span>
                    }
                  </td>
                  <td>
                    {!p.hasPaid && (
                      <button type="button" className="table-action" onClick={() => setShowPayment(p)}>
                        סמן כשולם
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="card-header">
          <h3 className="card-title">ספקים</h3>
          <Button size="sm" onClick={() => setShowVendor(true)}>ספק חדש</Button>
        </div>
        {vendors.length === 0 ? (
          <div className="empty-state">אין ספקים</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>שם ספק</th>
                  <th>סכום</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {vendors.map(v => (
                  <tr key={v.id}>
                    <td className="cell-primary">{v.name}</td>
                    <td>₪{v.amountOwed.toLocaleString()}</td>
                    <td>
                      <button type="button" className="table-action table-action--danger" onClick={() => deleteVendor(v.id)}>
                        מחק
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showVendor && (
        <Modal title="הוספת ספק" onClose={() => setShowVendor(false)}>
          <div className="form-stack">
            <Input label="שם ספק *" value={vendorForm.name}
              onChange={e => setVendorForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            <Input label="סכום לתשלום (₪) *" type="number" min="0" value={vendorForm.amountOwed}
              onChange={e => setVendorForm(f => ({ ...f, amountOwed: e.target.value }))} />
            {error && <div className="alert alert--error">{error}</div>}
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setShowVendor(false)}>ביטול</Button>
              <Button onClick={addVendor} loading={loading}>הוסף</Button>
            </div>
          </div>
        </Modal>
      )}

      {showPayment && (
        <Modal title={`סימון תשלום — ${showPayment.name}`} onClose={() => setShowPayment(null)}>
          <div className="form-stack">
            <Input label="סכום ששולם (₪)" type="number" min="0" value={paymentForm.amount}
              onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} autoFocus />
            <div className="radio-group">
              {[PaymentMethod.BankTransfer, PaymentMethod.Cash].map(m => (
                <label key={m} className="radio-label">
                  <input type="radio" checked={paymentForm.method === m}
                    onChange={() => setPaymentForm(f => ({ ...f, method: m }))} />
                  {PaymentMethodLabels[m]}
                </label>
              ))}
            </div>
            {error && <div className="alert alert--error">{error}</div>}
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setShowPayment(null)}>ביטול</Button>
              <Button onClick={markPayment} loading={loading}>שמור תשלום</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
