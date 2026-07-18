import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/Button'
import { RoleBadge } from '../ui/Badge'

export function Navbar() {
  const { isAuthenticated, username, isAdmin, role, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function isActive(path: string) {
    return location.pathname.startsWith(path)
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/events" className="navbar-brand">
          <span className="navbar-brand-mark">G</span>
          GatherUp
        </Link>

        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <nav className="navbar-links">
              <Link to="/events" className={`nav-link${isActive('/events') ? ' nav-link--active' : ''}`}>
                אירועים
              </Link>
              {isAdmin && (
                <Link to="/users" className={`nav-link${isActive('/users') ? ' nav-link--active' : ''}`}>
                  משתמשים
                </Link>
              )}
            </nav>
            <div className="navbar-user">
              {role !== null && <RoleBadge role={role} />}
              <span className="navbar-username">{username}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>יציאה</Button>
          </div>
        ) : (
          <Button size="sm" onClick={() => navigate('/login')}>התחברות</Button>
        )}
      </div>
    </header>
  )
}
