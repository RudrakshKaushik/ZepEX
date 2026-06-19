import { api } from './client'
import type {
  ApprovalWorkflow,
  AuditLogEntry,
  CompanyRegistrationRequest,
  CompanyRole,
  DepartmentRecord,
  EmployeeRecord,
  ExpenseReport,
  LoginResponse,
  PolicyRule,
  Receipt,
  ReimbursementEmailConfig,
  SmtpConfig,
  User,
  UserProfile,
} from '@/types'

// Auth
export const login = (email: string, password: string) =>
  api.post<LoginResponse>('/auth/login/', { email, password })

export const changePassword = (old_password: string, new_password: string) =>
  api.post('/auth/change-password/', { old_password, new_password })

export const forgotPassword = (email: string) =>
  api.post<{ message: string }>('/auth/forgot-password/', { email })

export const verifyResetOtp = (email: string, otp: string) =>
  api.post<{ message: string }>('/auth/verify-reset-otp/', { email, otp })

export const resetPassword = (email: string, otp: string, new_password: string) =>
  api.post<{ message: string }>('/auth/reset-password/', { email, otp, new_password })

export const getProfile = () => api.get<UserProfile>('/auth/profile/')

export const editProfile = (data: FormData) =>
  api.patch<{ message: string }>('/auth/edit-profile/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

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

// Tenants
export const createDepartment = (name: string) =>
  api.post<DepartmentRecord>('/tenants/departments/', { name })

export const listDepartments = () =>
  api.get<DepartmentRecord[]>('/tenants/departments/list/')

export const listCompanyRoles = () =>
  api.get<{ count: number; results: CompanyRole[] }>('/tenants/roles/')

export const createEmployee = (data: {
  first_name: string
  last_name: string
  email: string
  password: string
  role: string
  department_id?: string
  company_role_id?: number
}) => api.post('/tenants/employees/', data)

export const listEmployees = () =>
  api.get<EmployeeRecord[]>('/tenants/employees/list/')

export const assignMissingCompanyRoles = () =>
  api.post<{ message: string; updated_count: number }>(
    '/tenants/employees/assign-missing-roles/',
    {},
  )

export const assignManager = (department_id: string, manager_id: number) =>
  api.post('/tenants/assign-manager/', { department_id, manager_id })

export const updateDepartment = (
  departmentId: string,
  data: { name?: string; manager_id?: number | null },
) => api.patch(`/tenants/departments/${departmentId}/update/`, data)

export const deactivateDepartment = (departmentId: string) =>
  api.patch(`/tenants/departments/${departmentId}/deactivate/`)

export const activateDepartment = (departmentId: string) =>
  api.patch(`/tenants/departments/${departmentId}/activate/`)

export const deleteDepartment = (departmentId: string) =>
  api.delete(`/tenants/departments/${departmentId}/delete/`)

export const editCompanyUser = (
  userId: number,
  data: {
    first_name?: string
    last_name?: string
    role?: string
    company_role_id?: number | null
    department_id?: string | null
    phone_number?: string
    address?: string
  },
) => api.patch(`/tenants/users/${userId}/edit/`, data)

export const deactivateCompanyUser = (userId: number) =>
  api.patch(`/tenants/users/${userId}/deactivate/`)

export const activateCompanyUser = (userId: number) =>
  api.patch(`/tenants/users/${userId}/activate/`)

export const deleteCompanyUser = (userId: number) =>
  api.delete(`/tenants/users/${userId}/delete/`)

export const createCompanyRole = (data: {
  name: string
  can_upload_receipt: boolean
  can_submit_expense: boolean
  can_approve_expense: boolean
  can_mark_paid: boolean
}) => api.post('/tenants/roles/create/', data)

export const updateCompanyRole = (
  roleId: number,
  data: {
    name?: string
    can_upload_receipt?: boolean
    can_submit_expense?: boolean
    can_approve_expense?: boolean
    can_mark_paid?: boolean
  },
) => api.put(`/tenants/roles/${roleId}/update/`, data)

export const deactivateCompanyRole = (roleId: number) =>
  api.post(`/tenants/roles/${roleId}/deactivate/`)

export const updatePolicyRule = (
  ruleId: string,
  data: { max_amount?: number; category_description?: string },
) => api.patch(`/tenants/policy/rules/${ruleId}/update/`, data)

export const deactivatePolicyRule = (ruleId: string) =>
  api.patch(`/tenants/policy/rules/${ruleId}/deactivate/`)

export const activatePolicyRule = (ruleId: string) =>
  api.patch(`/tenants/policy/rules/${ruleId}/activate/`)

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
  smtp_host: string
  smtp_port: number
  smtp_email: string
  smtp_password: string
  from_email_name: string
  use_tls: boolean
  is_active: boolean
}) => api.post('/tenants/smtp-config/save/', data)

export const getCompanyAdminDashboard = () =>
  api.get('/dashboard/company-admin/')

export const getAuditLogs = (params?: {
  action?: string
  user_id?: number
  start_date?: string
  end_date?: string
}) => api.get<{ count: number; results: AuditLogEntry[] }>('/audit-logs/', { params })

export const getAuditLogDashboard = () => api.get('/audit-logs/dashboard/')

// Expenses
export const uploadReceipt = (file: File) => {
  const formData = new FormData()
  formData.append('receipt_file', file)
  return api.post<{
    message: string
    report_id: string
    receipt: Receipt
    ai_result?: { success?: boolean | null; pending?: boolean; error?: string }
  }>('/expenses/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const submitMonthlyReport = () =>
  api.post<{
    message: string
    success?: boolean
    workflow_started?: boolean
    report?: ExpenseReport
  }>('/expenses/reports/submit/')

export const getCurrentMonthReport = () =>
  api.get<ExpenseReport>('/expenses/reports/current/')

export const deleteLineItem = (lineItemId: string) =>
  api.delete(`/expenses/line-items/${lineItemId}/delete/`)

export const getMyPendingApprovals = () =>
  api.get<{ count: number; results: ExpenseReport[] }>('/expenses/approvals/my-pending/')

export const approveReport = (reportId: string, notes?: string) =>
  api.post(`/expenses/reports/${reportId}/approve/`, { notes })

export const rejectReport = (reportId: string, notes: string) =>
  api.post(`/expenses/reports/${reportId}/reject/`, { notes })

export const accountsMarkPaid = (reportId: string, notes: string) =>
  api.post(`/expenses/accounts/reports/${reportId}/paid/`, { notes })

export const triggerEmailFetch = () =>
  api.post<{ success: boolean; processed_count: number; skipped_count: number }>(
    '/expenses/emails/fetch/',
    {},
  )

// Approval workflow
export const getApprovalWorkflow = () => api.get<ApprovalWorkflow>('/expenses/workflow/')

export const saveApprovalWorkflow = (name = 'Default Approval Workflow') =>
  api.post<{ message: string; workflow: ApprovalWorkflow }>('/expenses/workflow/save/', {
    name,
  })

export const addWorkflowStep = (data: {
  step_order: number
  approver_role: number
  routing_type: 'DEPARTMENT' | 'COMPANY'
  department?: string | null
}) => api.post('/expenses/workflow/steps/add/', data)

export const deactivateWorkflowStep = (stepId: string) =>
  api.patch(`/expenses/workflow/steps/${stepId}/deactivate/`)

// Dashboards
export const getDashboard = () => api.get('/dashboard/')

export const getEmployeeDashboard = () => api.get('/dashboard/employee/')

export const getApproverDashboard = () => api.get('/dashboard/approver/')

export const getPaymentDashboard = () => api.get('/dashboard/payments/')

// Backward-compatible aliases
export const getCompanyAuditLogs = getAuditLogs
export const getManagerPendingReports = getMyPendingApprovals
export const managerApproveReport = approveReport
export const managerRejectReport = rejectReport
export const getManagerDashboard = getApproverDashboard
export const getAccountsDashboard = getPaymentDashboard

export type { User }
