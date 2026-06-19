import { Navigate, Outlet } from 'react-router-dom'
import { getStoredToken } from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import { canAccessRoute, defaultHomeForUser } from '@/lib/auth'
import type { UserPermissions, UserRole } from '@/types'

interface ProtectedRouteProps {
  allowedRoles: UserRole[]
  requiredPermission?: keyof UserPermissions
  loginPath?: string
}

export function ProtectedRoute({
  allowedRoles,
  requiredPermission,
  loginPath = '/login',
}: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth()
  const token = getStoredToken()

  if (!isAuthenticated || !token || !user) {
    return <Navigate to={loginPath} replace />
  }

  if (!canAccessRoute(user, allowedRoles, requiredPermission)) {
    return <Navigate to={defaultHomeForUser(user)} replace />
  }

  return <Outlet />
}
