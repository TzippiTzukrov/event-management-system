import { useEffect, useState } from 'react'
import { usersApi, type AppUserDto, type CreateUserResponse } from '../api/users'
import { UserRole } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
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
    { value: UserRole.Participant, label: 'משתתף' },
    { value: UserRole.Host,        label: 'בעל אירוע' },
    { value: UserRole.Manager,     label: 'מנהל אירוע' },
    { value: UserRole.Admin,       label: 'מנהל מערכת' },
  ]

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>טוען משתמשים...</p>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">ניהול משתמשים</h1>
          <p className="page-subtitle">{users.length} משתמשים רשומים</p>
        </div>
        <Button size="lg" onClick={() => setShowCreate(true)}>משתמש חדש</Button>
      </div>

      <Card>
        {users.length === 0 ? (
          <div className="empty-state">אין משתמשים רשומים</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>שם משתמש</th>
                  <th>אימייל</th>
                  <th>תפקיד</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="cell-primary">{u.username}</td>
                    <td>{u.email || '—'}</td>
                    <td><RoleBadge role={u.role} /></td>
                    <td>
                      <button type="button" className="table-action table-action--danger" onClick={() => handleDelete(u.id, u.username)}>
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

      {showCreate && (
        <Modal title="משתמש חדש" onClose={() => { setShowCreate(false); setError('') }}>
          <div className="form-stack">
            <Input label="שם משתמש *" value={form.username} autoFocus
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="הכנס שם משתמש" />
            <Input label="אימייל *" type="email" value={form.email}
              placeholder="הסיסמה תישלח לכתובת זו"
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <Select label="תפקיד" value={form.role}
              onChange={e => setForm(f => ({ ...f, role: Number(e.target.value) as UserRole }))}>
              {roleOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
            {error && <div className="alert alert--error">{error}</div>}
            <div className="form-actions">
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
        <Modal title="משתמש נוצר בהצלחה" onClose={() => setNewUser(null)}>
          <div className="form-stack">
            <div className="notice-box notice-box--success">
              <p><strong>שם משתמש:</strong> {newUser.username}</p>
              <p><strong>תפקיד:</strong> <RoleBadge role={newUser.role} /></p>
              {newUser.email && <p><strong>מייל:</strong> {newUser.email}</p>}
            </div>
            <div className="notice-box notice-box--warning">
              <p className="text-sm">
                הסיסמה מוצגת פעם אחת בלבד — העתיקי אותה עכשיו
                {newUser.email && ' (נשלח גם למייל)'}
              </p>
              <div className="password-display mt-4">
                <code>{newUser.temporaryPassword}</code>
                <Button size="sm" onClick={() => navigator.clipboard.writeText(newUser.temporaryPassword)}>
                  העתק
                </Button>
              </div>
            </div>
            <Button fullWidth onClick={() => setNewUser(null)}>הבנתי, סגור</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
