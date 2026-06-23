import { Navigate, Outlet } from 'react-router-dom'
import { getStoredToken } from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import { PageLoader } from '@/components/ui/shimmer'
import { canAccessRoute, defaultHomeForUser } from '@/lib/auth'
import type { UserPermissions, UserRole } from '@/types'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
  requiredPermission?: keyof UserPermissions
  anyPermissions?: (keyof UserPermissions)[]
  loginPath?: string
}

export function ProtectedRoute({
  allowedRoles = [],
  requiredPermission,
  anyPermissions,
  loginPath = '/login',
}: ProtectedRouteProps) {
  const { user, isAuthenticated, permissionsReady } = useAuth()
  const token = getStoredToken()

  if (!isAuthenticated || !token || !user) {
    return <Navigate to={loginPath} replace />
  }

  if (!permissionsReady) {
    return <PageLoader />
  }

  if (!canAccessRoute(user, allowedRoles, requiredPermission, anyPermissions)) {
    return <Navigate to={defaultHomeForUser(user)} replace />
  }

  return <Outlet />
}
