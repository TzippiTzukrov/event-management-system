import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { jwtDecode } from '../utils/jwt'
import { UserRole } from '../types'

interface AuthState {
  token: string | null
  userId: string | null
  username: string | null
  role: UserRole | null
}

interface AuthContextValue extends AuthState {
  login: (token: string) => void
  logout: () => void
  isAuthenticated: boolean
  isAdmin: boolean
  isManager: boolean
  isHost: boolean
  isParticipant: boolean
  canManage: boolean // Admin או Manager
}

const AuthContext = createContext<AuthContextValue | null>(null)

function parseToken(token: string): Omit<AuthState, 'token'> {
  try {
    const payload = jwtDecode(token)
    const roleStr = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? null
    const role = roleStr !== null ? (UserRole[roleStr as keyof typeof UserRole] ?? null) : null
    return {
      userId:   payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ?? null,
      username: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ?? null,
      role,
    }
  } catch {
    return { userId: null, username: null, role: null }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = localStorage.getItem('token')
  const [state, setState] = useState<AuthState>(() => {
    if (!stored) return { token: null, userId: null, username: null, role: null }
    return { token: stored, ...parseToken(stored) }
  })

  const login = useCallback((token: string) => {
    localStorage.setItem('token', token)
    setState({ token, ...parseToken(token) })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setState({ token: null, userId: null, username: null, role: null })
  }, [])

  const isAdmin       = state.role === UserRole.Admin
  const isManager     = state.role === UserRole.Manager
  const isHost        = state.role === UserRole.Host
  const isParticipant = state.role === UserRole.Participant
  const canManage     = isAdmin || isManager

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      logout,
      isAuthenticated: !!state.token,
      isAdmin,
      isManager,
      isHost,
      isParticipant,
      canManage,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
