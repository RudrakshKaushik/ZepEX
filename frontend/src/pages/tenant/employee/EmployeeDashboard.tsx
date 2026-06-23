import { CheckCircle2, Clock, FileText, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getEmployeeDashboard } from '@/api'
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState'
import { DashboardPanel } from '@/components/dashboard/DashboardPanel'
import { DashboardReportList } from '@/components/dashboard/DashboardReportList'
import { MetricCard } from '@/components/MetricCard'
import { ReportDetail } from '@/components/ReportDetail'
import { StatusBadge } from '@/components/StatusBadge'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { DashboardPageShimmer } from '@/components/ui/shimmer'
import { buildEmployeeNav } from '@/lib/rolePermissions'
import type { ExpenseReport } from '@/types'
import UploadIcon from '@/assets/Upload.png'

interface EmployeeDashboardData {
  user: { name: string; email: string; role: string; company: string; department: string }
  metrics: {
    total_reports: number
    pending_reports: number
    paid_reports: number
    rejected_reports: number
  }
  current_month_report: { report: ExpenseReport; summary: Record<string, string | number> } | null
  submitted_reports: ExpenseReport[]
}

export function EmployeeDashboard() {
  const { user } = useAuth()
  const navItems = buildEmployeeNav(user)
  const [data, setData] = useState<EmployeeDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role === 'MANAGER') return
    getEmployeeDashboard()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false))
  }, [user?.role])

  if (user?.role === 'MANAGER') {
    return <Navigate to="/manager" replace />
  }

  if (loading) {
    return (
      <DashboardLayout
        title="Employee Dashboard"
        breadcrumb="Employee Dashboard"
        navItems={navItems}
      >
        <DashboardPageShimmer />
      </DashboardLayout>
    )
  }

  const metrics = data?.metrics
  const currentReport = data?.current_month_report?.report
  const submittedReports = data?.submitted_reports ?? []

  return (
    <DashboardLayout
      title="Employee Dashboard"
      breadcrumb="Employee Dashboard"
      subtitle={`${data?.user.company} · ${data?.user.department}`}
      navItems={navItems}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total reports" value={metrics?.total_reports ?? 0} icon={FileText} />
        <MetricCard
          title="Pending"
          value={metrics?.pending_reports ?? 0}
          icon={Clock}
          accent="orange"
        />
        <MetricCard
          title="Paid"
          value={metrics?.paid_reports ?? 0}
          icon={CheckCircle2}
          accent="green"
        />
        <MetricCard
          title="Rejected"
          value={metrics?.rejected_reports ?? 0}
          icon={XCircle}
          accent="red"
        />
      </div>

      <div className="mt-6 space-y-6">
        <DashboardPanel
          title="Current Month Report"
          action={
            <Button asChild>
              <Link to="/employee/expenses">
                Upload receipt
                <img src={UploadIcon} alt="Upload" className="w-6 h-6" />
              </Link>
            </Button>
          }
        >
          {currentReport && currentReport.receipts?.length > 0 ? (
            <div>
              {currentReport.status === 'DRAFT' && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Your receipts are saved as a draft. Submit the report from{' '}
                  <Link to="/employee/expenses" className="font-medium underline">
                    My Expenses
                  </Link>{' '}
                  so your manager can review them.
                </div>
              )}
              <div className="mb-4 flex items-center justify-end">
                <StatusBadge status={currentReport.status} />
              </div>
              <ReportDetail report={currentReport} showEmployee={false} />
            </div>
          ) : (
            <DashboardEmptyState
              image="folder"
              title="No receipts this month"
              description="Upload your expense receipts to build your monthly reimbursement report."
              action={
                <Button asChild>
                  <Link to="/employee/expenses">
                    Upload receipt
                    <img src={UploadIcon} alt="Upload" className="w-6 h-6" />
                  </Link>
                </Button>
              }
            />
          )}
        </DashboardPanel>

        <DashboardPanel title="Submitted Reports">
          {submittedReports.length > 0 ? (
            <DashboardReportList
              reports={submittedReports.slice(0, 5)}
              showEmployee={false}
              viewTo={() => '/employee/expenses'}
            />
          ) : (
            <DashboardEmptyState
              image="calendar"
              title="No submitted reports yet"
              description="After you submit a monthly report, your reimbursement history will show here."
              action={
                <Button variant="outline" asChild>
                  <Link to="/employee/expenses">Go to expenses</Link>
                </Button>
              }
            />
          )}
        </DashboardPanel>
      </div>
    </DashboardLayout>
  )
}
