import type { User, UserPermissions, UserRole } from '@/types'

export const roleHome: Record<UserRole, string> = {
  PLATFORM_OWNER: '/platform',
  COMPANY_ADMIN: '/admin',
  MANAGER: '/manager',
  EMPLOYEE: '/employee',
  ACCOUNTS: '/accounts',
}

const redirectPathMap: Record<string, string> = {
  '/platform-dashboard': '/platform',
  '/company-admin-dashboard': '/admin',
  '/employee-dashboard': '/employee',
  '/approver-dashboard': '/manager',
  '/payment-dashboard': '/accounts',
}

export interface LoginUserPayload {
  id: number
  email: string
  first_name: string
  last_name: string
  system_role: UserRole
  company_role?: string | null
  company_role_id?: number | null
  permissions?: UserPermissions
  company: User['company']
  department: User['department']
}

export function normalizeLoginUser(user: LoginUserPayload): User {
  return {
    id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.system_role,
    system_role: user.system_role,
    company_role: user.company_role ?? null,
    company_role_id: user.company_role_id ?? null,
    permissions: user.permissions,
    company: user.company,
    department: user.department,
  }
}

export function resolvePostLoginPath(user: User, redirectTo?: string | null): string {
  if (user.permissions?.can_mark_paid) return '/accounts'
  if (user.permissions?.can_approve_expense) return '/manager'
  if (redirectTo && redirectPathMap[redirectTo]) return redirectPathMap[redirectTo]
  return roleHome[user.role]
}

export function canAccessRoute(
  user: User,
  allowedRoles: UserRole[],
  permission?: keyof UserPermissions,
): boolean {
  if (permission && user.permissions?.[permission]) return true
  return allowedRoles.includes(user.role)
}

export function defaultHomeForUser(user: User): string {
  return resolvePostLoginPath(user)
}
