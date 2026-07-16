import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function AdminRoute() {
  const { canManage } = useAuth()
  return canManage ? <Outlet /> : <Navigate to="/events" replace />
}
