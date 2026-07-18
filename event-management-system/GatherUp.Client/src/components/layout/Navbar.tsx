import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/Button'
import { RoleBadge } from '../ui/Badge'

export function Navbar() {
  const { isAuthenticated, username, isAdmin, role, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header>
      <nav>
        <Link to="/events">GatherUp</Link>
        {isAuthenticated ? (
          <>
            <Link to="/events">אירועים</Link>
            {isAdmin && <Link to="/users">משתמשים</Link>}
            {role !== null && <RoleBadge role={role} />}
            <span>{username}</span>
            <Button onClick={handleLogout}>יציאה</Button>
          </>
        ) : (
          <Button onClick={() => navigate('/login')}>התחברות</Button>
        )}
      </nav>
    </header>
  )
}
