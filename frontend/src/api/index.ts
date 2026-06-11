import { api } from './client'
import type {
  AuditLogEntry,
  CompanyRegistrationRequest,
  DepartmentRecord,
  EmployeeRecord,
  ExpenseReport,
  LoginResponse,
  PolicyRule,
  Receipt,
  ReimbursementEmailConfig,
  SmtpConfig,
  User,
} from '@/types'

// Auth
export const login = (email: string, password: string) =>
  api.post<LoginResponse>('/auth/login/', { email, password })

export const changePassword = (old_password: string, new_password: string) =>
  api.post('/auth/change-password/', { old_password, new_password })

// Platform
export const registerCompany = (data: {
  company_name: string
  company_domain: string
  admin_name: string
  admin_email: string
}) => api.post<CompanyRegistrationRequest>('/platform/register-company/', data)

export const listCompanyRequests = () =>
  api.get<CompanyRegistrationRequest[]>('/platform/requests/')

export const approveCompanyRequest = (requestId: number) =>
  api.post(`/platform/approve/${requestId}/`)

export const rejectCompanyRequest = (requestId: number) =>
  api.post(`/platform/reject/${requestId}/`)

export const getPlatformDashboard = () => api.get('/dashboard/platform-owner/')

export const getPlatformAuditLogs = () =>
  api.get<{ count: number; results: AuditLogEntry[] }>('/audit-logs/platform/')

// Tenants
export const createDepartment = (name: string) =>
  api.post<DepartmentRecord>('/tenants/departments/', { name })

export const listDepartments = () =>
  api.get<DepartmentRecord[]>('/tenants/departments/list/')

export const createEmployee = (data: {
  first_name: string
  last_name: string
  email: string
  password: string
  role: string
  department_id?: string
}) => api.post('/tenants/employees/', data)

export const listEmployees = () =>
  api.get<EmployeeRecord[]>('/tenants/employees/list/')

export const assignManager = (department_id: string, manager_id: string) =>
  api.post('/tenants/assign-manager/', { department_id, manager_id })

export const createCompanyPolicy = () => api.post('/tenants/policy/')

export const createPolicyRule = (data: {
  category_name: string
  max_amount: number
  category_description: string
}) => api.post<PolicyRule>('/tenants/policy/rules/create/', data)

export const listPolicyRules = () =>
  api.get<PolicyRule[]>('/tenants/policy/rules/')

export const getReimbursementEmailConfig = () =>
  api.get<ReimbursementEmailConfig | { message: string }>('/tenants/reimbursement-email/')

export const saveReimbursementEmailConfig = (data: {
  email_address: string
  imap_host: string
  imap_port: number
  imap_username: string
  imap_password: string
  is_active: boolean
}) => api.post('/tenants/reimbursement-email/save/', data)

export const getSmtpConfig = () =>
  api.get<SmtpConfig | { message: string }>('/tenants/smtp-config/')

export const saveSmtpConfig = (data: {
  host: string
  port: number
  username: string
  password: string
  from_email: string
  use_tls: boolean
  is_active: boolean
}) => api.post('/tenants/smtp-config/save/', data)

export const getCompanyAdminDashboard = () =>
  api.get('/dashboard/company-admin/')

export const getCompanyAuditLogs = () =>
  api.get<{ count: number; results: AuditLogEntry[] }>('/audit-logs/company/')

// Expenses
export const uploadReceipt = (file: File) => {
  const formData = new FormData()
  formData.append('receipt_file', file)
  return api.post<{
    message: string
    report_id: string
    receipt: Receipt
    ai_result?: { success?: boolean | null; pending?: boolean; error?: string }
  }>(
    '/expenses/upload/',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
}

export const submitMonthlyReport = () =>
  api.post<{ message: string; report: ExpenseReport }>('/expenses/reports/submit/')

export const getCurrentMonthReport = () =>
  api.get<ExpenseReport>('/expenses/reports/current/')

export const deleteLineItem = (lineItemId: string) =>
  api.delete(`/expenses/line-items/${lineItemId}/delete/`)

export const getManagerPendingReports = () =>
  api.get<ExpenseReport[]>('/expenses/manager/reports/pending/')

export const managerApproveReport = (reportId: string, notes: string) =>
  api.post(`/expenses/manager/reports/${reportId}/approve/`, { notes })

export const managerRejectReport = (reportId: string, notes: string) =>
  api.post(`/expenses/manager/reports/${reportId}/reject/`, { notes })

export const getAccountsPendingReports = () =>
  api.get<{ total_pending_reports: number; reports: ExpenseReport[] }>(
    '/expenses/accounts/reports/pending/',
  )

export const accountsApproveReport = (reportId: string, notes: string) =>
  api.post(`/expenses/accounts/reports/${reportId}/approve/`, { notes })

export const accountsRejectReport = (reportId: string, notes: string) =>
  api.post(`/expenses/accounts/reports/${reportId}/reject/`, { notes })

export const accountsMarkPaid = (reportId: string, notes: string) =>
  api.post(`/expenses/accounts/reports/${reportId}/paid/`, { notes })

export const triggerEmailFetch = () =>
  api.post('/expenses/emails/fetch/', {})

// Dashboards
export const getEmployeeDashboard = () => api.get('/dashboard/employee/')
export const getManagerDashboard = () => api.get('/dashboard/manager/')
export const getAccountsDashboard = () => api.get('/dashboard/accounts/')

export type { User }
