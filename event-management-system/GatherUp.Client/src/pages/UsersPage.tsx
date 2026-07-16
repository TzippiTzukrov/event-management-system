import { useEffect, useState } from 'react'
import { usersApi, type AppUserDto, type CreateUserResponse } from '../api/users'
import { UserRole, UserRoleLabels } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { RoleBadge } from '../components/ui/Badge'

export function UsersPage() {
  const [users, setUsers] = useState<AppUserDto[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [newUser, setNewUser] = useState<CreateUserResponse | null>(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ username: '', role: UserRole.Participant, email: '' })

  function load() {
    usersApi.getAll()
      .then(setUsers)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    setError('')
    setCreateLoading(true)
    try {
      const res = await usersApi.create(form)
      setNewUser(res)
      setShowCreate(false)
      setForm({ username: '', role: UserRole.Participant, email: '' })
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה')
    } finally {
      setCreateLoading(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`למחוק את ${name}?`)) return
    await usersApi.delete(id)
    load()
  }

  const roleOptions = [
    { value: UserRole.Participant, label: '👤 משתתף' },
    { value: UserRole.Host,        label: '🎂 בעל אירוע' },
    { value: UserRole.Manager,     label: '🎯 מנהל אירוע' },
    { value: UserRole.Admin,       label: '👑 מנהל מערכת' },
  ]

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-64 gap-4">
      <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">טוען משתמשים...</p>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ניהול משתמשים</h1>
          <p className="text-gray-500 mt-1 text-sm">{users.length} משתמשים רשומים</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="lg">+ משתמש חדש</Button>
      </div>

      <Card>
        {users.length === 0 ? (
          <p className="text-center text-gray-400 py-16 text-lg">אין משתמשים רשומים</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/80 text-gray-500 text-right">
                <th className="px-5 py-4 font-semibold rounded-tr-2xl">שם משתמש</th>
                <th className="px-5 py-4 font-semibold">אימייל</th>
                <th className="px-5 py-4 font-semibold">תפקיד</th>
                <th className="px-5 py-4 rounded-tl-2xl"></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-violet-50/30 transition-colors">
                  <td className="px-5 py-4 font-semibold text-gray-800">{u.username}</td>
                  <td className="px-5 py-4 text-gray-500">{u.email || '—'}</td>
                  <td className="px-5 py-4">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-5 py-4 text-left">
                    <button onClick={() => handleDelete(u.id, u.username)}
                      className="text-xs text-red-400 hover:text-red-600 hover:underline transition-colors">
                      מחק
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showCreate && (
        <Modal title="✨ משתמש חדש" onClose={() => { setShowCreate(false); setError('') }}>
          <div className="space-y-4">
            <Input label="שם משתמש *" value={form.username} autoFocus
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="הכנס שם משתמש" />
            <Input label="אימייל *" type="email" value={form.email}
              placeholder="הסיסמה תישלח לכתובת זו"
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">תפקיד</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: Number(e.target.value) as UserRole }))}
                className="border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-400 hover:border-gray-300 transition-all bg-white"
              >
                {roleOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {error && <p className="text-sm text-red-500 flex items-center gap-1">⚠ {error}</p>}
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" onClick={() => { setShowCreate(false); setError('') }}>ביטול</Button>
              <Button onClick={handleCreate} loading={createLoading}
                disabled={!form.username.trim() || !form.email.trim()}>
                צור משתמש
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {newUser && (
        <Modal title="✅ משתמש נוצר בהצלחה" onClose={() => setNewUser(null)}>
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm space-y-2">
              <p><span className="font-semibold text-gray-700">שם משתמש:</span> <span className="text-gray-600">{newUser.username}</span></p>
              <p><span className="font-semibold text-gray-700">תפקיד:</span> <RoleBadge role={newUser.role} /></p>
              {newUser.email && <p><span className="font-semibold text-gray-700">מייל:</span> <span className="text-gray-600">{newUser.email}</span></p>}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs text-amber-700 font-semibold mb-3">
                ⚠️ הסיסמה מוצגת פעם אחת בלבד — העתיקי אותה עכשיו
                {newUser.email && ' (נשלח גם למייל)'}
              </p>
              <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-amber-200">
                <code className="text-xl font-bold tracking-widest text-gray-800 flex-1 select-all">
                  {newUser.temporaryPassword}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(newUser.temporaryPassword)}
                  className="text-xs bg-violet-600 text-white rounded-lg px-3 py-1.5 hover:bg-violet-700 transition-colors shrink-0">
                  העתק
                </button>
              </div>
            </div>
            <Button className="w-full justify-center" onClick={() => setNewUser(null)}>
              הבנתי, סגור
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
