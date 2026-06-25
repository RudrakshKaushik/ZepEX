import { api } from './client'
import type {
  AddWorkflowStepResponse,
  AdminReportsResponse,
  ApprovalWorkflow,
  ApproveReportResponse,
  AuditLogEntry,
  CompanyRegistrationRequest,
  CompanyRole,
  DeactivateWorkflowStepResponse,
  DepartmentRecord,
  DuplicateReceiptsResponse,
  EmployeeRecord,
  ExpenseReport,
  LoginResponse,
  MarkPaidReportResponse,
  MyUploadedExpensesResponse,
  PendingApprovalsResponse,
  PolicyRule,
  Receipt,
  ReimbursementEmailConfig,
  RejectReportResponse,
  SmtpConfig,
  UpdateWorkflowStepResponse,
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

export const listDepartments = (params?: { page?: number; search?: string }) =>
  api.get<import('@/lib/pagination').PaginatedResponse<DepartmentRecord>>(
    '/tenants/departments/list/',
    { params },
  )

export const listCompanyRoles = (params?: {
  page?: number
  search?: string
  can_approve_expense?: string
}) =>
  api.get<import('@/lib/pagination').PaginatedResponse<CompanyRole>>('/tenants/roles/', {
    params,
  })

export const createEmployee = (data: {
  first_name: string
  last_name: string
  email: string
  password: string
  role: string
  department_id?: string
  company_role_id?: number
}) => api.post('/tenants/employees/', data)

export const listEmployees = (params?: {
  page?: number
  search?: string
  department_id?: string
  role?: string
}) =>
  api.get<import('@/lib/pagination').PaginatedResponse<EmployeeRecord>>(
    '/tenants/employees/list/',
    { params },
  )

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

export const listPolicyRules = (params?: { page?: number; search?: string; category?: string }) =>
  api.get<import('@/lib/pagination').PaginatedResponse<PolicyRule>>(
    '/tenants/policy/rules/',
    { params },
  )

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
  company_id?: string
  start_date?: string
  end_date?: string
  page?: number
}) =>
  api.get<import('@/lib/pagination').PaginatedResponse<AuditLogEntry>>('/audit-logs/', {
    params,
  })

export const getPlatformAuditLogs = (params?: {
  action?: string
  company_id?: string
  start_date?: string
  end_date?: string
  page?: number
}) =>
  api.get<import('@/lib/pagination').PaginatedResponse<AuditLogEntry>>('/audit-logs/platform/', {
    params,
  })

export const listPlatformCompanies = () =>
  api.get<{
    count: number
    results: Array<{ id: string; name: string; domain: string; is_verified: boolean }>
  }>('/platform/companies/')

function uploadCsv(path: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return api.post<import('@/types').CsvImportResult>(path, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const importDepartments = (file: File) =>
  uploadCsv('/tenants/departments/import/', file)

export const importCompanyRolesCsv = (file: File) => uploadCsv('/tenants/roles/import/', file)

export const importEmployeesCsv = (file: File) => uploadCsv('/tenants/employees/import/', file)

export const importPolicyRulesCsv = (file: File) =>
  uploadCsv('/tenants/policy-rules/import/', file)

export const getDepartmentTemplateInfo = () =>
  api.get<import('@/types').CsvTemplateInfo>('/tenants/departments/template/')

export const getRolesTemplateInfo = () =>
  api.get<import('@/types').CsvTemplateInfo>('/tenants/roles/template/')

export const getEmployeesTemplateInfo = () =>
  api.get<import('@/types').CsvTemplateInfo>('/tenants/employees/template/')

export const getPolicyRulesTemplateInfo = () =>
  api.get<import('@/types').CsvTemplateInfo>('/tenants/policy-rules/template/')

async function downloadCsvTemplate(path: string, fallbackName: string) {
  const response = await api.get<Blob>(path, { responseType: 'blob' })
  const { downloadBlob, filenameFromContentDisposition } = await import('@/lib/csvDownload')
  const filename = filenameFromContentDisposition(
    response.headers['content-disposition'],
    fallbackName,
  )
  downloadBlob(response.data, filename)
}

export const downloadDepartmentTemplate = () =>
  downloadCsvTemplate('/tenants/departments/template/download/', 'department_template.csv')

export const downloadRolesTemplate = () =>
  downloadCsvTemplate('/tenants/roles/template/download/', 'roles_template.csv')

export const downloadEmployeesTemplate = () =>
  downloadCsvTemplate('/tenants/employees/template/download/', 'employees_template.csv')

export const downloadPolicyRulesTemplate = () =>
  downloadCsvTemplate('/tenants/policy-rules/template/download/', 'policy_rules_template.csv')

export const sendEmployeeInvites = (data: { employee_ids?: string[]; send_to_all?: boolean }) =>
  api.post<import('@/types').EmployeeInviteResult>('/tenants/employees/send-invites/', data)

export const getPlatformCompanyDetails = (
  companyId: string,
  params?: {
    section?: 'all' | 'departments' | 'employees' | 'roles' | 'policy_rules' | 'workflow'
    page?: number
    page_size?: number
    search?: string
    department_id?: string
    role?: string
    company_role_id?: string
    category?: string
  },
) =>
  api.get<import('@/types').PlatformCompanyDetailsResponse>(
    `/platform/companies/${companyId}/details/`,
    { params },
  )

export const deactivatePlatformCompany = (companyId: string) =>
  api.patch(`/platform/companies/${companyId}/deactivate/`)

export const activatePlatformCompany = (companyId: string) =>
  api.patch(`/platform/companies/${companyId}/activate/`)

export const deletePlatformCompany = (companyId: string) =>
  api.delete(`/platform/companies/${companyId}/delete/`)

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

export const getMyUploadedExpenses = (params?: {
  status?: string
  start_date?: string
  end_date?: string
  min_amount?: string
  max_amount?: string
}) => api.get<MyUploadedExpensesResponse>('/expenses/my-uploaded-expenses/', { params })

export const getDuplicateReceipts = (params?: { type?: string }) =>
  api.get<DuplicateReceiptsResponse>('/expenses/duplicates/', { params })

export const deleteLineItem = (lineItemId: string) =>
  api.delete(`/expenses/line-items/${lineItemId}/delete/`)

export const getMyPendingApprovals = (params?: {
  employee_id?: number
  employee_email?: string
  department_id?: string
  start_date?: string
  end_date?: string
  min_amount?: string
  max_amount?: string
  page?: number
}) => api.get<PendingApprovalsResponse>('/expenses/approvals/my-pending/', { params })

export const getMyApprovedApprovals = (params?: {
  employee_id?: number
  employee_email?: string
  department_id?: string
  start_date?: string
  end_date?: string
  min_amount?: string
  max_amount?: string
  page?: number
}) => api.get<PendingApprovalsResponse>('/expenses/approvals/my-approved/', { params })

export const getAdminReports = (params?: {
  status?: string
  employee_id?: number
  employee_email?: string
  department_id?: string
  start_date?: string
  end_date?: string
  page?: number
}) => api.get<AdminReportsResponse>('/expenses/admin/reports/', { params })

export const approveReport = (reportId: string, notes?: string) =>
  api.post<ApproveReportResponse>(`/expenses/reports/${reportId}/approve/`, { notes })

export const rejectReport = (reportId: string, notes: string) =>
  api.post<RejectReportResponse>(`/expenses/reports/${reportId}/reject/`, { notes })

export const accountsMarkPaid = (reportId: string, notes: string) =>
  api.post<MarkPaidReportResponse>(`/expenses/accounts/reports/${reportId}/paid/`, { notes })

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
}) => api.post<AddWorkflowStepResponse>('/expenses/workflow/steps/add/', data)

export const deactivateWorkflowStep = (stepId: string) =>
  api.patch<DeactivateWorkflowStepResponse>(`/expenses/workflow/steps/${stepId}/deactivate/`)

export const updateWorkflowStep = (
  stepId: string,
  data: {
    step_order?: number
    approver_role?: number
    routing_type?: 'DEPARTMENT' | 'COMPANY'
    department?: string | null
  },
) => api.patch<UpdateWorkflowStepResponse>(`/expenses/workflow/steps/${stepId}/update/`, data)

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
