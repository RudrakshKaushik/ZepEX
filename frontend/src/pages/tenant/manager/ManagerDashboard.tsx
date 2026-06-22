import { CheckCircle2, Clock, FileText, Upload, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApproverDashboard, getCompanyAuditLogs } from '@/api'
import { AdminAuditFeed } from '@/components/admin/AdminAuditFeed'
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState'
import { DashboardPanel } from '@/components/dashboard/DashboardPanel'
import { DashboardReportList } from '@/components/dashboard/DashboardReportList'
import { MetricCard } from '@/components/MetricCard'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/ui/spinner'
import { useAuth } from '@/context/AuthContext'
import { buildManagerNav, canManageOwnExpenses } from '@/lib/rolePermissions'
import type { AuditLogEntry, ExpenseReport } from '@/types'

interface ApproverDashboardData {
  approver: {
    name: string
    email: string
    company: string
    company_role: string
    department: string | null
  }
  metrics: {
    pending_reports: number
    approved_reports: number
    rejected_reports: number
    violation_reports: number
    pending_amount: string
    approved_amount: string
    rejected_amount: string
  }
  recent_pending_reports: ExpenseReport[]
  pending_reports: ExpenseReport[]
}

export function ManagerDashboard() {
  const { user } = useAuth()
  const navItems = buildManagerNav(user)
  const [data, setData] = useState<ApproverDashboardData | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getApproverDashboard().then((res) => res.data),
      getCompanyAuditLogs()
        .then((res) => res.data.results.slice(0, 6))
        .catch(() => [] as AuditLogEntry[]),
    ])
      .then(([dashboardData, logs]) => {
        setData(dashboardData)
        setAuditLogs(logs)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const metrics = data?.metrics
  const pendingReports = data?.recent_pending_reports ?? []
  const departmentLabel = data?.approver.department ?? 'All departments'

  return (
    <DashboardLayout
      title="Manager Dashboard"
      breadcrumb="Manager Dashboard"
      subtitle={`${departmentLabel} · ${data?.approver.company}`}
      navItems={navItems}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Reports"
          value={
            (metrics?.pending_reports ?? 0) +
            (metrics?.approved_reports ?? 0) +
            (metrics?.rejected_reports ?? 0)
          }
          icon={FileText}
          accent="blue"
        />
        <MetricCard
          title="Approved"
          value={metrics?.approved_reports ?? 0}
          icon={CheckCircle2}
          accent="green"
        />
        <MetricCard
          title="Pending"
          value={metrics?.pending_reports ?? 0}
          icon={Clock}
          accent="orange"
        />
        <MetricCard
          title="Rejected"
          value={metrics?.rejected_reports ?? 0}
          icon={XCircle}
          accent="red"
        />
      </div>

      {canManageOwnExpenses(user) && (
        <div className="mt-6">
          <DashboardPanel
            title="My Expenses"
            action={
              <Button asChild>
                <Link to="/manager/expenses">
                  <Upload className="h-4 w-4" />
                  Upload receipt
                </Link>
              </Button>
            }
          >
            <DashboardEmptyState
              image="folder"
              title="Submit your own expenses"
              description="Upload receipts and submit your monthly expense report from My Expenses."
              action={
                <Button variant="outline" asChild>
                  <Link to="/manager/expenses">Go to My Expenses</Link>
                </Button>
              }
            />
          </DashboardPanel>
        </div>
      )}

      <div className="mt-6">
        <DashboardPanel
          title="Pending Employee Reports"
          action={
            <Button asChild>
              <Link to="/manager/reports">View All Reports</Link>
            </Button>
          }
        >
          {pendingReports.length > 0 ? (
            <DashboardReportList
              reports={pendingReports}
              viewTo={() => '/manager/reports'}
            />
          ) : (
            <DashboardEmptyState
              image="folder"
              title="No pending reports"
              description="Reports appear here after employees submit their monthly expense report. Uploaded receipts that are still in draft are not visible to managers until submitted."
              action={
                <Button variant="outline" asChild>
                  <Link to="/manager/reports">View all reports</Link>
                </Button>
              }
            />
          )}
        </DashboardPanel>
      </div>

      <div className="mt-6">
        <AdminAuditFeed logs={auditLogs} viewAllTo="/manager/audit-logs" />
      </div>
    </DashboardLayout>
  )
}
