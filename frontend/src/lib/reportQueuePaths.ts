import type { User, UserRole } from '@/types'
import { canApproveExpense, canMarkPaid } from '@/lib/rolePermissions'

export function reportBasePath(role: UserRole): string {
  switch (role) {
    case 'MANAGER':
      return '/manager'
    case 'ACCOUNTS':
      return '/accounts'
    default:
      return '/employee'
  }
}

export function pendingReportsPath(role: UserRole): string {
  return `${reportBasePath(role)}/reports/pending`
}

export function approvedReportsPath(role: UserRole): string {
  return `${reportBasePath(role)}/reports/approved`
}

export function defaultReportsPath(user: User | null): string {
  if (!user) return '/employee'
  if (canApproveExpense(user) || canMarkPaid(user)) return pendingReportsPath(user.role)
  return reportBasePath(user.role)
}
