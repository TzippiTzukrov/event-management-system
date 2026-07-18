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
    <div dir="rtl" className="login-page">
      <div className="login-panel--brand">
        <h1 className="login-brand-title">GatherUp</h1>
        <p className="login-brand-text">
          מערכת לניהול אירועים, משתתפים, סקרים ותשלומים — במקום אחד.
        </p>
      </div>

      <div className="login-panel--form">
        <div className="login-form-wrap">
          <h2 className="login-form-title">התחברות</h2>
          <p className="login-form-subtitle">הזינו את פרטי הכניסה שלכם</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <Input label="שם משתמש" value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
            <Input label="סיסמה" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            {error && <div className="alert alert--error">{error}</div>}
            <Button type="submit" loading={loading} fullWidth>התחברות</Button>
          </form>

          <div className="demo-accounts">
            <p className="demo-accounts-title">חשבונות לדוגמה</p>
            <div className="demo-accounts-list">
              {[
                { label: 'מנהל מערכת', user: 'admin', pass: 'admin123' },
                { label: 'מנהל אירוע', user: 'manager', pass: 'manager123' },
              ].map(c => (
                <button
                  key={c.user}
                  type="button"
                  className="demo-account-btn"
                  onClick={() => { setUsername(c.user); setPassword(c.pass) }}
                >
                  <span className="demo-account-role">{c.label}</span>
                  <span>{c.user}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
