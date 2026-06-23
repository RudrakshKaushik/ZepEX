import type { NavItem } from '@/components/layout/DashboardLayout'
import {
  Building2,
  ClipboardList,
  GitBranch,
  LayoutDashboard,
  ScrollText,
  Settings,
  Shield,
  UserCog,
  Users,
} from 'lucide-react'

export const adminNavBase: NavItem[] = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Departments', to: '/admin/departments', icon: Building2 },
  { label: 'Employees', to: '/admin/employees', icon: Users },
  { label: 'Roles', to: '/admin/roles', icon: UserCog },
  { label: 'Workflow', to: '/admin/workflow', icon: GitBranch },
  { label: 'Policy', to: '/admin/policy', icon: Shield },
  { label: 'Reports', to: '/admin/reports', icon: ClipboardList },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
  { label: 'Audit Logs', to: '/admin/audit-logs', icon: ScrollText },
]

export function buildAdminNav(): NavItem[] {
  return [...adminNavBase]
}
