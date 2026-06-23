import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { defaultHomeForUser } from '@/lib/auth'
import { defaultReportsPath } from '@/lib/reportQueuePaths'

interface ReportsRedirectProps {
  role: 'manager' | 'accounts'
}

export function ReportsRedirect({ role }: ReportsRedirectProps) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (role === 'manager' && user.role !== 'MANAGER') {
    return <Navigate to={defaultHomeForUser(user)} replace />
  }

  if (role === 'accounts' && user.role !== 'ACCOUNTS') {
    return <Navigate to={defaultHomeForUser(user)} replace />
  }

  return <Navigate to={defaultReportsPath(user)} replace />
}
