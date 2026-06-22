import { User } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { userRoleLabel } from '@/lib/dashboardNav'
import { cn } from '@/lib/utils'

export function SidebarUserSummary() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <NavLink
      to="/profile"
      className={({ isActive }) =>
        cn(
          'flex w-full items-center gap-3 rounded-lg px-2 py-2 transition-colors',
          isActive ? 'bg-[#eff6ff]' : 'hover:bg-gray-50',
        )
      }
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
        {(user.first_name?.[0] ?? user.email[0]).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-medium text-gray-900">{user.email}</p>
        <p className="truncate text-xs text-gray-500">{userRoleLabel(user)}</p>
      </div>
      <User className="h-4 w-4 shrink-0 text-gray-400" />
    </NavLink>
  )
}
