export type AuditLogFilters = {
  action?: string
  user_id?: string
  company_id?: string
  start_date?: string
  end_date?: string
}

export const AUDIT_ACTION_OPTIONS = [
  { label: 'Receipt uploaded', value: 'RECEIPT_UPLOADED' },
  { label: 'Email receipt received', value: 'EMAIL_RECEIPT_RECEIVED' },
  { label: 'AI processing started', value: 'AI_PROCESSING_STARTED' },
  { label: 'AI processed', value: 'AI_PROCESSED' },
  { label: 'Report submitted', value: 'REPORT_SUBMITTED' },
  { label: 'Step approved', value: 'STEP_APPROVED' },
  { label: 'Step rejected', value: 'STEP_REJECTED' },
  { label: 'Marked paid', value: 'MARKED_PAID' },
  { label: 'Workflow configured', value: 'WORKFLOW_CONFIGURED' },
  { label: 'Workflow step created', value: 'WORKFLOW_STEP_CREATED' },
  { label: 'Email fetch triggered', value: 'EMAIL_FETCH_TRIGGERED' },
  { label: 'Line item deleted', value: 'LINE_ITEM_DELETED' },
  { label: 'Policy updated', value: 'POLICY_UPDATED' },
  { label: 'User updated', value: 'USER_UPDATED' },
  { label: 'User deactivated', value: 'USER_DEACTIVATED' },
  { label: 'User activated', value: 'USER_ACTIVATED' },
  { label: 'Department created', value: 'DEPARTMENT_CREATED' },
  { label: 'Department updated', value: 'DEPARTMENT_UPDATED' },
  { label: 'Department deactivated', value: 'DEPARTMENT_DEACTIVATED' },
  { label: 'Department activated', value: 'DEPARTMENT_ACTIVATED' },
  { label: 'Policy rule updated', value: 'POLICY_RULE_UPDATED' },
  { label: 'Policy rule deactivated', value: 'POLICY_RULE_DEACTIVATED' },
  { label: 'Policy rule activated', value: 'POLICY_RULE_ACTIVATED' },
  { label: 'Policy rule deleted', value: 'POLICY_RULE_DELETED' },
  { label: 'Company deactivated', value: 'COMPANY_DEACTIVATED' },
  { label: 'Company activated', value: 'COMPANY_ACTIVATED' },
  { label: 'User deleted', value: 'USER_DELETED' },
  { label: 'Department deleted', value: 'DEPARTMENT_DELETED' },
  { label: 'Database connected', value: 'DATABASE_CONNECTED' },
  { label: 'Database connection failed', value: 'DATABASE_CONNECTION_FAILED' },
  { label: 'Sync started', value: 'SYNC_STARTED' },
  { label: 'Sync completed', value: 'SYNC_COMPLETED' },
  { label: 'Sync failed', value: 'SYNC_FAILED' },
] as const

export function hasAuditLogFilters(filters: AuditLogFilters) {
  return Object.values(filters).some((value) => Boolean(value?.trim()))
}

export function toAuditLogApiParams(filters: AuditLogFilters, page: number) {
  const params: Record<string, string | number> = { page }
  if (filters.action?.trim()) params.action = filters.action.trim()
  if (filters.user_id?.trim()) params.user_id = Number(filters.user_id)
  if (filters.company_id?.trim()) params.company_id = filters.company_id.trim()
  if (filters.start_date?.trim()) params.start_date = filters.start_date.trim()
  if (filters.end_date?.trim()) params.end_date = filters.end_date.trim()
  return params
}
