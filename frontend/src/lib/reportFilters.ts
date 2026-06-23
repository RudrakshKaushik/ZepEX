import type { ExpenseReport } from '@/types'

export type ApprovalReportFilters = {
  employee_id?: string
  employee_email?: string
  department_id?: string
  start_date?: string
  end_date?: string
  min_amount?: string
  max_amount?: string
}

export type AdminReportFilters = {
  employee_id?: string
  employee_email?: string
  department_id?: string
  start_date?: string
  end_date?: string
}

export type EmployeeExpenseFilters = {
  status?: string
  start_date?: string
  end_date?: string
  min_amount?: string
  max_amount?: string
}

export const REPORT_STATUS_OPTIONS = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Paid', value: 'PAID' },
] as const

function hasValue(value?: string) {
  return Boolean(value?.trim())
}

export function hasApprovalFilters(filters: ApprovalReportFilters) {
  return Object.values(filters).some(hasValue)
}

export function hasAdminFilters(filters: AdminReportFilters) {
  return Object.values(filters).some(hasValue)
}

export function hasEmployeeExpenseFilters(filters: EmployeeExpenseFilters) {
  return Object.values(filters).some(hasValue)
}

export function toApprovalApiParams(filters: ApprovalReportFilters) {
  const params: Record<string, string | number> = {}
  if (hasValue(filters.employee_id)) params.employee_id = Number(filters.employee_id!)
  if (hasValue(filters.employee_email)) params.employee_email = filters.employee_email!.trim()
  if (hasValue(filters.department_id)) params.department_id = filters.department_id!
  if (hasValue(filters.start_date)) params.start_date = filters.start_date!
  if (hasValue(filters.end_date)) params.end_date = filters.end_date!
  if (hasValue(filters.min_amount)) params.min_amount = filters.min_amount!
  if (hasValue(filters.max_amount)) params.max_amount = filters.max_amount!
  return params
}

export function toAdminApiParams(filters: AdminReportFilters, page: number) {
  const params: Record<string, string | number> = { page }
  if (hasValue(filters.employee_id)) params.employee_id = Number(filters.employee_id!)
  if (hasValue(filters.employee_email)) params.employee_email = filters.employee_email!.trim()
  if (hasValue(filters.department_id)) params.department_id = filters.department_id!
  if (hasValue(filters.start_date)) params.start_date = filters.start_date!
  if (hasValue(filters.end_date)) params.end_date = filters.end_date!
  return params
}

export function toEmployeeExpenseApiParams(filters: EmployeeExpenseFilters) {
  const params: Record<string, string> = {}
  if (hasValue(filters.status)) params.status = filters.status!
  if (hasValue(filters.start_date)) params.start_date = filters.start_date!
  if (hasValue(filters.end_date)) params.end_date = filters.end_date!
  if (hasValue(filters.min_amount)) params.min_amount = filters.min_amount!
  if (hasValue(filters.max_amount)) params.max_amount = filters.max_amount!
  return params
}

export function applyClientReportFilters(
  reports: ExpenseReport[],
  filters: ApprovalReportFilters,
): ExpenseReport[] {
  if (!hasApprovalFilters(filters)) return reports

  return reports.filter((report) => {
    if (hasValue(filters.employee_id) && String(report.employee) !== filters.employee_id) {
      return false
    }
    if (
      hasValue(filters.employee_email) &&
      !report.employee_email.toLowerCase().includes(filters.employee_email!.trim().toLowerCase())
    ) {
      return false
    }
    if (hasValue(filters.department_id) && report.department !== filters.department_id) {
      return false
    }
    if (hasValue(filters.start_date) && report.submitted_at) {
      if (report.submitted_at.slice(0, 10) < filters.start_date!) return false
    }
    if (hasValue(filters.end_date) && report.submitted_at) {
      if (report.submitted_at.slice(0, 10) > filters.end_date!) return false
    }
    if (hasValue(filters.min_amount)) {
      if (Number(report.total_amount) < Number(filters.min_amount)) return false
    }
    if (hasValue(filters.max_amount)) {
      if (Number(report.total_amount) > Number(filters.max_amount)) return false
    }
    return true
  })
}
