import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/Button'
import { RoleBadge } from '../ui/Badge'

export function Navbar() {
  const { isAuthenticated, username, canManage, isAdmin, role, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/events" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:shadow-indigo-300 transition-shadow">
            <span className="text-white text-lg">🎉</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            GatherUp
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link to="/events"
                className="text-sm text-gray-600 hover:text-violet-600 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-violet-50">
                אירועים
              </Link>
              {isAdmin && (
                <Link to="/users"
                  className="text-sm text-gray-600 hover:text-violet-600 transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-violet-50">
                  משתמשים
                </Link>
              )}
              <div className="flex items-center gap-2 pr-2 border-r border-gray-200">
                {role !== null && <RoleBadge role={role} />}
                <span className="text-sm text-gray-500 font-medium">{username}</span>
              </div>
              <Button variant="secondary" size="sm" onClick={handleLogout}>יציאה</Button>
            </>
          ) : (
            <Button size="sm" onClick={() => navigate('/login')}>התחברות</Button>
          )}
        </nav>
      </div>
    </header>
  )
}
