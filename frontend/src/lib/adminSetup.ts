export const SETUP_LABELS: Record<string, string> = {
  departments_created: 'Departments Created',
  users_created: 'User Control',
  roles_created: 'Roles Created',
  workflow_configured: 'Workflow Configured',
  workflow_steps_created: 'Workflow Steps Created',
  policy_configured: 'Policy Configured',
  reimbursement_email_configured: 'Reimbursement Email Configured',
  smtp_configured: 'SMTP Configured',
}

export const SETUP_LINKS: Partial<Record<string, string>> = {
  departments_created: '/admin/departments',
  users_created: '/admin/employees',
  roles_created: '/admin/roles',
  workflow_configured: '/admin/workflow',
  workflow_steps_created: '/admin/workflow',
  policy_configured: '/admin/policy',
  reimbursement_email_configured: '/admin/settings',
  smtp_configured: '/admin/settings',
}

export function isSetupComplete(setup: Record<string, boolean>) {
  const keys = Object.keys(setup)
  if (keys.length === 0) return false
  return keys.every((key) => setup[key])
}

export function getSetupLabel(key: string) {
  return SETUP_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
