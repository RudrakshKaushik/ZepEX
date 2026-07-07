export const SETUP_LABELS: Record<string, string> = {
  departments_created: 'Departments Created',
  users_created: 'User Control',
  roles_created: 'Roles Created',
  workflow_configured: 'Workflow Configured',
  workflow_steps_created: 'Workflow Steps Created',
  policy_configured: 'Policy Configured',
}

export const SETUP_LINKS: Partial<Record<string, string>> = {
  departments_created: '/admin/departments',
  users_created: '/admin/employees',
  roles_created: '/admin/roles',
  workflow_configured: '/admin/workflow',
  workflow_steps_created: '/admin/workflow',
  policy_configured: '/admin/policy',
}

/** Email (SMTP/IMAP) is configured via server environment, not admin UI. */
const HIDDEN_SETUP_KEYS = new Set([
  'smtp_configured',
  'reimbursement_email_configured',
])

export function getVisibleSetupEntries(setup: Record<string, boolean>) {
  return Object.entries(setup).filter(([key]) => !HIDDEN_SETUP_KEYS.has(key))
}

export function isSetupComplete(setup: Record<string, boolean>) {
  const entries = getVisibleSetupEntries(setup)
  if (entries.length === 0) return false
  return entries.every(([, done]) => done)
}

export function getSetupLabel(key: string) {
  return SETUP_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
