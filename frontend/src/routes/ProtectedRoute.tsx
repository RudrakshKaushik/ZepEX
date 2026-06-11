import { Navigate, Outlet } from 'react-router-dom'
import { getStoredToken } from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
  allowedRoles: UserRole[]
  loginPath?: string
}

export function ProtectedRoute({ allowedRoles, loginPath = '/login' }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth()
  const token = getStoredToken()

  if (!isAuthenticated || !token || !user) {
    return <Navigate to={loginPath} replace />
  }

  if (!allowedRoles.includes(user.role)) {
    const fallback: Record<UserRole, string> = {
      PLATFORM_OWNER: '/platform',
      COMPANY_ADMIN: '/admin',
      MANAGER: '/manager',
      EMPLOYEE: '/employee',
      ACCOUNTS: '/accounts',
    }
    return <Navigate to={fallback[user.role]} replace />
  }

  return <Outlet />
}
