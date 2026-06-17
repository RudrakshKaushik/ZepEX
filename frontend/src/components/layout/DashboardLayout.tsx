import {
  Building2,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  Shield,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/lib/utils'

export interface NavItem {
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
}

interface DashboardLayoutProps {
  title: string
  subtitle?: string
  navItems: NavItem[]
  children: ReactNode
  portal?: 'platform' | 'tenant'
}

export function DashboardLayout({
  title,
  subtitle,
  navItems,
  children,
  portal = 'tenant',
}: DashboardLayoutProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate(portal === 'platform' ? '/platform/login' : '/login')
  }

  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-background lg:flex">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={cn(
          'z-50 flex w-[min(16rem,85vw)] flex-col border-r border-border bg-card lg:static lg:w-64 lg:shrink-0',
          sidebarOpen ? 'fixed inset-y-0 left-0' : 'hidden lg:flex',
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground',
            )}
          >
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold leading-none">ZepEX</p>
          </div>
          <button
            type="button"
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.split('/').length <= 2}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <div className="mb-3 rounded-lg bg-muted/60 p-3">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            {user?.company && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3" />
                {user.company.name}
              </p>
            )}
          </div>
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-h-screen w-full min-w-0 flex-1 flex-col lg:min-h-0">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur sm:gap-4 sm:px-6">
          <button
            type="button"
            className="shrink-0 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold sm:text-lg">{title}</h1>
            {subtitle && (
              <p className="truncate text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
            )}
          </div>
        </header>

        <main className="box-border w-full min-w-0 max-w-full flex-1 overflow-x-clip p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export const platformNav: NavItem[] = [
  { label: 'Dashboard', to: '/platform', icon: LayoutDashboard },
  { label: 'Company Requests', to: '/platform/requests', icon: Building2 },
]

export const adminNav: NavItem[] = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Departments', to: '/admin/departments', icon: Building2 },
  { label: 'Employees', to: '/admin/employees', icon: Users },
  { label: 'Policy', to: '/admin/policy', icon: Shield },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
  { label: 'Audit Logs', to: '/admin/audit-logs', icon: ScrollText },
]

export const employeeNav: NavItem[] = [
  { label: 'Dashboard', to: '/employee', icon: LayoutDashboard },
  { label: 'Expenses', to: '/employee/expenses', icon: Wallet },
]

export const managerNav: NavItem[] = [
  { label: 'Dashboard', to: '/manager', icon: LayoutDashboard },
  { label: 'Pending Reports', to: '/manager/reports', icon: Wallet },
  { label: 'My Expenses', to: '/manager/expenses', icon: Wallet },
]

export const accountsNav: NavItem[] = [
  { label: 'Dashboard', to: '/accounts', icon: LayoutDashboard },
  { label: 'Pending Reports', to: '/accounts/reports', icon: Wallet },
]
