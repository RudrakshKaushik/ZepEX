import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage'
import { PlatformLoginPage } from '@/pages/platform/PlatformLoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { PlatformDashboard } from '@/pages/platform/PlatformDashboard'
import { CompanyRequestsPage } from '@/pages/platform/CompanyRequestsPage'
import { PlatformAuditLogsPage } from '@/pages/platform/PlatformAuditLogsPage'
import { AdminDashboard } from '@/pages/tenant/admin/AdminDashboard'
import { DepartmentsPage } from '@/pages/tenant/admin/DepartmentsPage'
import { EmployeesPage } from '@/pages/tenant/admin/EmployeesPage'
import { PolicyPage } from '@/pages/tenant/admin/PolicyPage'
import { SettingsPage } from '@/pages/tenant/admin/SettingsPage'
import { AuditLogsPage } from '@/pages/tenant/admin/AuditLogsPage'
import { EmployeeDashboard } from '@/pages/tenant/employee/EmployeeDashboard'
import { ExpensesPage } from '@/pages/tenant/employee/ExpensesPage'
import { ManagerDashboard } from '@/pages/tenant/manager/ManagerDashboard'
import { ManagerReportsPage } from '@/pages/tenant/manager/ManagerReportsPage'
import { ManagerAuditLogsPage } from '@/pages/tenant/manager/ManagerAuditLogsPage'
import { AccountsDashboard } from '@/pages/tenant/accounts/AccountsDashboard'
import { AccountsReportsPage } from '@/pages/tenant/accounts/AccountsReportsPage'
import { RolesPage } from '@/pages/tenant/admin/RolesPage'
import { WorkflowPage } from '@/pages/tenant/admin/WorkflowPage'
import { AdminReportsPage } from '@/pages/tenant/admin/AdminReportsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { Toaster } from '@/components/ui/toaster'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/platform/login" element={<PlatformLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  'PLATFORM_OWNER',
                  'COMPANY_ADMIN',
                  'MANAGER',
                  'EMPLOYEE',
                  'ACCOUNTS',
                ]}
                loginPath="/login"
              />
            }
          >
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route
            element={
              <ProtectedRoute allowedRoles={['PLATFORM_OWNER']} loginPath="/platform/login" />
            }
          >
            <Route path="/platform" element={<PlatformDashboard />} />
            <Route path="/platform/requests" element={<CompanyRequestsPage />} />
            <Route path="/platform/audit-logs" element={<PlatformAuditLogsPage />} />
            <Route path="/platform-dashboard" element={<Navigate to="/platform" replace />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['COMPANY_ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/departments" element={<DepartmentsPage />} />
            <Route path="/admin/employees" element={<EmployeesPage />} />
            <Route path="/admin/roles" element={<RolesPage />} />
            <Route path="/admin/workflow" element={<WorkflowPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/policy" element={<PolicyPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
            <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
            <Route
              path="/company-admin-dashboard"
              element={<Navigate to="/admin" replace />}
            />
          </Route>

          <Route
            element={
              <ProtectedRoute
                anyPermissions={['can_upload_receipt', 'can_submit_expense']}
              />
            }
          >
            <Route path="/employee/expenses" element={<ExpensesPage />} />
            <Route path="/manager/expenses" element={<ExpensesPage />} />
            <Route path="/accounts/expenses" element={<ExpensesPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['EMPLOYEE']} />}>
            <Route path="/employee" element={<EmployeeDashboard />} />
            <Route
              path="/employee-dashboard"
              element={<Navigate to="/employee" replace />}
            />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['MANAGER']} requiredPermission="can_approve_expense" />}>
            <Route path="/manager" element={<ManagerDashboard />} />
            <Route path="/manager/reports" element={<ManagerReportsPage />} />
            <Route path="/manager/audit-logs" element={<ManagerAuditLogsPage />} />
            <Route
              path="/manager-dashboard"
              element={<Navigate to="/manager" replace />}
            />
            <Route
              path="/approver-dashboard"
              element={<Navigate to="/manager" replace />}
            />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ACCOUNTS']} requiredPermission="can_mark_paid" />}>
            <Route path="/accounts" element={<AccountsDashboard />} />
            <Route path="/accounts/reports" element={<AccountsReportsPage />} />
            <Route
              path="/accounts-dashboard"
              element={<Navigate to="/accounts" replace />}
            />
            <Route
              path="/payment-dashboard"
              element={<Navigate to="/accounts" replace />}
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
