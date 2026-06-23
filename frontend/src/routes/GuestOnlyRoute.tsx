import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { getStoredToken } from '@/api/client'
import { useAuth } from '@/context/AuthContext'
import { PageLoader } from '@/components/ui/shimmer'
import { defaultHomeForUser } from '@/lib/auth'

interface GuestOnlyRouteProps {
  children: ReactNode
}

/** Auth pages only — logged-in users are sent to their dashboard. */
export function GuestOnlyRoute({ children }: GuestOnlyRouteProps) {
  const { user, isAuthenticated, permissionsReady } = useAuth()
  const token = getStoredToken()

  if (isAuthenticated && token && user) {
    if (!permissionsReady) return <PageLoader />
    return <Navigate to={defaultHomeForUser(user)} replace />
  }

  return children
}
