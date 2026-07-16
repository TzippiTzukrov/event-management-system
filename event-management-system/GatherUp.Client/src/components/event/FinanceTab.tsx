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

  // המשתתף המחובר
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

  // תצוגה למשתמש רגיל — רק פרטי התשלום שלו
  if (!canManage) {
    if (!currentParticipant) {
      return (
        <Card className="p-8 text-center text-gray-400">
          אינך רשום/ה כמשתתף/ת באירוע זה
        </Card>
      )
    }

    return (
      <div className="space-y-4">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-700 mb-4">מצב התשלום שלי</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">סכום לתשלום</span>
              <span className="font-semibold text-gray-800">
                {event.pricePerParticipant ? `₪${event.pricePerParticipant}` : 'לא הוגדר'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-500">סטטוס תשלום</span>
              {currentParticipant.hasPaid
                ? <span className="text-green-600 font-medium">✓ שולם (₪{currentParticipant.amountPaid})</span>
                : <span className="text-red-500 font-medium">טרם שולם</span>
              }
            </div>
            {!currentParticipant.hasPaid && (
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-500">אמצעי תשלום</span>
                <span className="text-gray-700">{PaymentMethodLabels[event.paymentMethod]}</span>
              </div>
            )}
            {!currentParticipant.hasPaid && event.paymentMethod === PaymentMethod.BankTransfer && event.bankDetails && (
              <div className="py-2 border-b">
                <p className="text-gray-500 mb-1">פרטי חשבון בנק</p>
                <p className="text-gray-700 font-medium">{event.bankDetails}</p>
              </div>
            )}
            {!currentParticipant.hasPaid && event.paymentMethod === PaymentMethod.Cash && event.cashContactName && (
              <div className="py-2 border-b">
                <p className="text-gray-500 mb-1">תשלום מזומן אצל</p>
                <p className="text-gray-700 font-medium">{event.cashContactName}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    )
  }

  // תצוגה מלאה למנהל
  return (
    <div className="space-y-6">
      {/* סיכום תקציב */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">נגבה</p>
          <p className="text-2xl font-bold text-green-600">₪{totalCollected.toLocaleString()}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">חובות לספקים</p>
          <p className="text-2xl font-bold text-red-500">₪{totalVendors.toLocaleString()}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">יתרה</p>
          <p className={`text-2xl font-bold ${totalCollected - totalVendors >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>
            ₪{(totalCollected - totalVendors).toLocaleString()}
          </p>
        </Card>
      </div>

      {/* תשלומי משתתפים */}
      <Card>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-700">תשלומי משתתפים</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-gray-500 text-right">
              <th className="px-4 py-3 font-medium">שם</th>
              <th className="px-4 py-3 font-medium">סכום ששולם</th>
              <th className="px-4 py-3 font-medium">סטטוס</th>
              <th className="px-4 py-3 font-medium">פעולה</th>
            </tr>
          </thead>
          <tbody>
            {participants.map(p => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3">₪{p.amountPaid ?? 0}</td>
                <td className="px-4 py-3">
                  {p.hasPaid
                    ? <span className="text-green-600 font-medium">שולם</span>
                    : <span className="text-gray-400">ממתין</span>
                  }
                </td>
                <td className="px-4 py-3">
                  {!p.hasPaid && (
                    <button onClick={() => setShowPayment(p)} className="text-xs text-indigo-500 hover:underline">
                      סמן כשולם
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* ספקים */}
      <Card>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-700">ספקים</h3>
          <Button onClick={() => setShowVendor(true)}>+ ספק</Button>
        </div>
        {vendors.length === 0 ? (
          <p className="text-center text-gray-400 py-8">אין ספקים</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-500 text-right">
                <th className="px-4 py-3 font-medium">שם ספק</th>
                <th className="px-4 py-3 font-medium">סכום</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(v => (
                <tr key={v.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{v.name}</td>
                  <td className="px-4 py-3">₪{v.amountOwed.toLocaleString()}</td>
                  <td className="px-4 py-3 text-left">
                    <button onClick={() => deleteVendor(v.id)} className="text-xs text-red-400 hover:text-red-600">מחק</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* מודל ספק */}
      {showVendor && (
        <Modal title="הוספת ספק" onClose={() => setShowVendor(false)}>
          <div className="space-y-4">
            <Input label="שם ספק *" value={vendorForm.name}
              onChange={e => setVendorForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            <Input label="סכום לתשלום (₪) *" type="number" min="0" value={vendorForm.amountOwed}
              onChange={e => setVendorForm(f => ({ ...f, amountOwed: e.target.value }))} />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowVendor(false)}>ביטול</Button>
              <Button onClick={addVendor} loading={loading}>הוסף</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* מודל תשלום */}
      {showPayment && (
        <Modal title={`סימון תשלום — ${showPayment.name}`} onClose={() => setShowPayment(null)}>
          <div className="space-y-4">
            <Input label="סכום ששולם (₪)" type="number" min="0" value={paymentForm.amount}
              onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} autoFocus />
            <div className="flex gap-4">
              {[PaymentMethod.BankTransfer, PaymentMethod.Cash].map(m => (
                <label key={m} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={paymentForm.method === m}
                    onChange={() => setPaymentForm(f => ({ ...f, method: m }))} />
                  <span className="text-sm">{PaymentMethodLabels[m]}</span>
                </label>
              ))}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowPayment(null)}>ביטול</Button>
              <Button onClick={markPayment} loading={loading}>שמור תשלום</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
