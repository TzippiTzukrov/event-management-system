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
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 flex items-center justify-center p-4" dir="rtl">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl mb-4 shadow-2xl">
            <span className="text-4xl">🎉</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">GatherUp</h1>
          <p className="text-white/70 text-base">ניהול אירועים חכם ופשוט</p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">ברוכים הבאים 👋</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="שם משתמש"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
              placeholder="הכנס שם משתמש"
            />
            <Input
              label="סיסמה"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="הכנס סיסמה"
            />
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                ⚠ {error}
              </div>
            )}
            <Button type="submit" loading={loading} className="w-full justify-center mt-1" size="lg">
              התחברות
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-center text-gray-400 font-medium mb-2">פרטי כניסה לדוגמה</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '👑 מנהל מערכת', user: 'admin', pass: 'admin123' },
                { label: '🎯 מנהל אירוע', user: 'manager', pass: 'manager123' },
              ].map(c => (
                <button key={c.user}
                  type="button"
                  onClick={() => { setUsername(c.user); setPassword(c.pass) }}
                  className="text-xs bg-gray-50 hover:bg-violet-50 border border-gray-200 hover:border-violet-300 rounded-xl px-3 py-2 text-gray-600 hover:text-violet-700 transition-all text-right">
                  <span className="font-medium block">{c.label}</span>
                  <span className="text-gray-400">{c.user}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
