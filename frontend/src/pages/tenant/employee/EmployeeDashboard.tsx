import { CheckCircle2, Clock, FileText, Upload, XCircle } from 'lucide-react'
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
import { DashboardLayout, employeeNav } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/ui/spinner'
import type { ExpenseReport } from '@/types'

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

  if (loading) return <PageLoader />

  const metrics = data?.metrics
  const currentReport = data?.current_month_report?.report
  const submittedReports = data?.submitted_reports ?? []

  return (
    <DashboardLayout
      title="Employee Dashboard"
      breadcrumb="Employee Dashboard"
      subtitle={`${data?.user.company} · ${data?.user.department}`}
      navItems={employeeNav}
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
                <Upload className="h-4 w-4" />
                Upload receipt
              </Link>
            </Button>
          }
        >
          {currentReport && currentReport.receipts?.length > 0 ? (
            <div>
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
                    <Upload className="h-4 w-4" />
                    Upload receipt
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
