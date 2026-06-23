import { User } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { UserAvatar } from '@/components/ui/user-avatar'
import { useAuth } from '@/context/AuthContext'
import { userRoleLabel } from '@/lib/dashboardNav'
import { getUserDisplayName } from '@/lib/userDisplay'
import { cn } from '@/lib/utils'

export function SidebarUserSummary() {
  const { user } = useAuth()

  if (!user) return null

  const displayName = getUserDisplayName(user.first_name, user.last_name, user.email)

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
      <UserAvatar
        src={user.profile_picture}
        firstName={user.first_name}
        lastName={user.last_name}
        email={user.email}
        size="sm"
      />
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-medium text-gray-900">{displayName}</p>
        <p className="truncate text-xs text-gray-500">{userRoleLabel(user)}</p>
      </div>
      <User className="h-4 w-4 shrink-0 text-gray-400" />
    </NavLink>
  )
}
