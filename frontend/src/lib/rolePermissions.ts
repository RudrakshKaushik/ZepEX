import { ClipboardList, LayoutDashboard, ScrollText, Wallet } from 'lucide-react'
import type { NavItem } from '@/components/layout/DashboardLayout'
import type { User, UserPermissions } from '@/types'

export function hasPermission(user: User | null, permission: keyof UserPermissions) {
  return Boolean(user?.permissions?.[permission])
}

export function canUploadReceipt(user: User | null) {
  return hasPermission(user, 'can_upload_receipt')
}

export function canSubmitExpense(user: User | null) {
  return hasPermission(user, 'can_submit_expense')
}

export function canManageOwnExpenses(user: User | null) {
  return canUploadReceipt(user) || canSubmitExpense(user)
}

export function canApproveExpense(user: User | null) {
  return hasPermission(user, 'can_approve_expense')
}

export function canMarkPaid(user: User | null) {
  return hasPermission(user, 'can_mark_paid')
}

export function expensePathForUser(user: User | null) {
  switch (user?.role) {
    case 'MANAGER':
      return '/manager/expenses'
    case 'ACCOUNTS':
      return '/accounts/expenses'
    case 'EMPLOYEE':
    default:
      return '/employee/expenses'
  }
}

export function buildEmployeeNav(user: User | null): NavItem[] {
  const items: NavItem[] = [
    { label: 'Dashboard', to: '/employee', icon: LayoutDashboard },
  ]
  if (canManageOwnExpenses(user)) {
    items.push({ label: 'Expenses', to: '/employee/expenses', icon: Wallet })
  }
  return items
}

export function buildManagerNav(user: User | null): NavItem[] {
  const items: NavItem[] = [
    { label: 'Dashboard', to: '/manager', icon: LayoutDashboard },
  ]
  if (canManageOwnExpenses(user)) {
    items.push({ label: 'My Expenses', to: '/manager/expenses', icon: Wallet })
  }
  if (canApproveExpense(user)) {
    items.push({ label: 'Pending Reports', to: '/manager/reports', icon: ClipboardList })
  }
  items.push({ label: 'Audit Logs', to: '/manager/audit-logs', icon: ScrollText })
  return items
}

export function buildAccountsNav(user: User | null): NavItem[] {
  const items: NavItem[] = [
    { label: 'Dashboard', to: '/accounts', icon: LayoutDashboard },
  ]
  if (canManageOwnExpenses(user)) {
    items.push({ label: 'My Expenses', to: '/accounts/expenses', icon: Wallet })
  }
  if (canMarkPaid(user)) {
    items.push({ label: 'Approved Reports', to: '/accounts/reports', icon: ClipboardList })
  }
  return items
}

export function navItemsForUser(user: User | null): NavItem[] {
  if (!user) return buildEmployeeNav(null)

  switch (user.role) {
    case 'MANAGER':
      return buildManagerNav(user)
    case 'ACCOUNTS':
      return buildAccountsNav(user)
    case 'EMPLOYEE':
    default:
      return buildEmployeeNav(user)
  }
}
