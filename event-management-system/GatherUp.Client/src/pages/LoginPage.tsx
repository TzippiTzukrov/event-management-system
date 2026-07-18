import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login({ username, password })
      login(res.token)
      navigate('/events')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהתחברות')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir="rtl">
      <h1>GatherUp</h1>
      <form onSubmit={handleSubmit}>
        <Input label="שם משתמש" value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
        <Input label="סיסמה" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        {error && <p>{error}</p>}
        <Button type="submit" loading={loading}>התחברות</Button>
      </form>
      <div>
        <p>פרטי כניסה לדוגמה</p>
        {[
          { label: 'מנהל מערכת', user: 'admin', pass: 'admin123' },
          { label: 'מנהל אירוע', user: 'manager', pass: 'manager123' },
        ].map(c => (
          <button key={c.user} type="button" onClick={() => { setUsername(c.user); setPassword(c.pass) }}>
            {c.label} ({c.user})
          </button>
        ))}
      </div>
    </div>
  )
}
