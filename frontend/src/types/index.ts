export type UserRole =
  | 'PLATFORM_OWNER'
  | 'COMPANY_ADMIN'
  | 'MANAGER'
  | 'EMPLOYEE'
  | 'ACCOUNTS'

export interface UserPermissions {
  can_upload_receipt: boolean
  can_submit_expense: boolean
  can_approve_expense: boolean
  can_mark_paid: boolean
  can_manage_users?: boolean
  can_manage_policy?: boolean
  can_manage_workflow?: boolean
  can_view_all_reports?: boolean
  can_view_audit_logs?: boolean
}

export interface Company {
  id: string
  name: string
}

export interface Department {
  id: string
  name: string
}

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  role: UserRole
  system_role?: UserRole
  company_role?: string | null
  company_role_id?: number | null
  permissions?: UserPermissions
  company: Company | null
  department: Department | null
  profile_picture?: string | null
}

export interface LoginResponse {
  message: string
  token: string
  user: {
    id: number
    email: string
    first_name: string
    last_name: string
    system_role: UserRole
    company_role?: string | null
    company_role_id?: number | null
    permissions?: UserPermissions
    company: Company | null
    department: Department | null
  }
  redirect_to: string
}

export interface UserProfile {
  id: number
  email: string
  first_name: string
  last_name: string
  role: UserRole
  company_role?: string | null
  company_role_id?: number | null
  company: string
  department: string
  phone_number: string | null
  address: string | null
  profile_picture: string | null
  permissions?: UserPermissions
}

export interface CompanyRole {
  id: number
  name: string
  can_upload_receipt: boolean
  can_submit_expense: boolean
  can_approve_expense: boolean
  can_mark_paid: boolean
  is_active: boolean
  created_at: string
}

export interface CompanyRegistrationRequest {
  id: number
  company_name: string
  company_domain: string
  admin_name: string
  admin_email: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  created_at: string
}

export interface DepartmentRecord {
  id: string
  name: string
  manager: string | null
  is_active?: boolean
  created_at: string
}

export interface EmployeeRecord {
  id: number
  email: string
  first_name: string
  last_name: string
  company: string
  department: string | null
  department_name?: string
  role: UserRole
  company_role?: number | null
  company_role_name?: string
  phone_number?: string | null
  address?: string | null
  is_active?: boolean
  created_at: string
  profile_picture?: string | null
}

export interface PolicyRule {
  id: string
  policy: string
  category_name: string
  max_amount: string
  category_description: string
  is_active?: boolean
}

export interface ApprovalWorkflowStep {
  id: string
  workflow?: string
  step_order: number
  approver_role: number
  approver_role_name: string
  department: string | null
  department_name: string | null
  routing_type: 'DEPARTMENT' | 'COMPANY'
  is_active: boolean
  created_at: string
}

export interface ApprovalWorkflow {
  id: string
  company: string
  name: string
  is_active: boolean
  steps: ApprovalWorkflowStep[]
  created_at: string
  updated_at: string
}

export interface LineItem {
  id: string
  description: string
  category: string
  vendor: string
  amount: string
  bill_date: string
  is_violating: boolean
  violation_reason: string | null
  created_at: string
}

export interface Receipt {
  id: string
  report: string
  submission: string
  company: string
  employee: number
  employee_email: string
  department: string
  department_name: string
  receipt_file: string
  vendor_name: string | null
  invoice_date: string | null
  total_amount: string
  currency: string
  status: string
  policy_violation_reason: string | null
  has_duplicate_violation: boolean
  has_old_bill_violation: boolean
  has_amount_violation: boolean
  has_any_violation: boolean
  manager_notes: string | null
  accounts_notes: string | null
  line_items: LineItem[]
  created_at: string
  updated_at: string
}

export interface WorkflowTimelineEntry {
  step_order: number
  step_name: string
  status: string
  action_by: string | null
  action_role: string
  comments: string | null
  action_at?: string | null
}

export interface ReportCurrentStep {
  id?: string
  step_order: number
  approver_role: string
  routing_type: 'DEPARTMENT' | 'COMPANY'
  department: string | null
}

export interface LatestRejectionReason {
  rejected_by: string
  role: string
  reason: string
  rejected_at: string
}

export interface ExpenseReport {
  id: string
  company: string
  employee: number
  employee_email: string
  employee_name?: string
  employee_profile_picture?: string | null
  department: string
  department_name: string
  month: string
  status: string
  total_amount: string
  submitted_at: string | null
  manager_action_at?: string | null
  accounts_action_at?: string | null
  paid_at: string | null
  paid_notes?: string | null
  manager_notes?: string | null
  accounts_notes?: string | null
  current_step?: ReportCurrentStep | null
  workflow_timeline?: WorkflowTimelineEntry[]
  latest_rejection_reason?: LatestRejectionReason | null
  workflow_completed?: boolean
  receipts: Receipt[]
  created_at: string
  updated_at: string
}

export interface ApproveReportResponse {
  message: string
  approved_by: string
  is_company_admin_override: boolean
  next_step?: {
    step_order: number
    role: string
    routing_type: string
    department: string | null
  }
  status?: string
  report: ExpenseReport
}

export interface RejectReportResponse {
  message: string
  rejected_by: string
  is_company_admin_override: boolean
  status: string
  report: ExpenseReport
}

export interface MarkPaidReportResponse {
  message: string
  paid_by: string
  is_company_admin_override: boolean
  report: ExpenseReport
}

export interface AddWorkflowStepResponse {
  message: string
  step: ApprovalWorkflowStep
}

export interface DeactivateWorkflowStepResponse {
  message: string
  workflow_steps_reordered: boolean
}

export interface UpdateWorkflowStepResponse {
  message: string
  step: {
    id: string
    step_order: number
    approver_role: { id: string; name: string } | number
    routing_type: 'DEPARTMENT' | 'COMPANY'
    department: string | null
    is_active: boolean
    created_at: string
  }
}

export interface PendingApprovalsResponse {
  count: number
  filters: Record<string, string | null>
  results: ExpenseReport[]
}

export interface AdminReportsResponse {
  count: number
  total_pages: number
  current_page: number
  filters: Record<string, string | null>
  results: ExpenseReport[]
}

export interface AuditLogEntry {
  id: string
  company: string
  company_name?: string
  action: string
  message: string
  metadata: Record<string, unknown>
  action_by?: number | null
  action_by_email: string
  created_at: string
}

export interface MyUploadedExpensesResponse {
  count: number
  filters: Record<string, string | null>
  results: ExpenseReport[]
}

export interface DuplicateReceiptLog {
  id: string
  original_receipt: string
  duplicate_receipt: string
  duplicate_type: 'SAME_EMPLOYEE' | 'CROSS_EMPLOYEE'
  original_employee_email: string
  duplicate_employee_email: string
  original_vendor: string
  duplicate_vendor: string
  created_at: string
}

export interface DuplicateReceiptsResponse {
  count: number
  filters?: { type?: string | null }
  results: DuplicateReceiptLog[]
}

export interface ReimbursementEmailConfig {
  id: string
  email_address: string
  imap_host: string
  imap_port: number
  imap_username: string
  is_active: boolean
  last_checked_at: string | null
  created_at: string
}

export interface SmtpConfig {
  id: string
  smtp_host: string
  smtp_port: number
  smtp_email: string
  from_email_name: string
  use_tls: boolean
  is_active: boolean
}
