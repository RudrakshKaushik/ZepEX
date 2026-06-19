import { CheckCircle2, Clock, FileText, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApproverDashboard } from '@/api'
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState'
import { DashboardPanel } from '@/components/dashboard/DashboardPanel'
import { DashboardReportList } from '@/components/dashboard/DashboardReportList'
import { MetricCard } from '@/components/MetricCard'
import { DashboardLayout, managerNav } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/ui/spinner'
import type { ExpenseReport } from '@/types'

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
  const [data, setData] = useState<ApproverDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getApproverDashboard()
      .then((res) => setData(res.data))
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
      navItems={managerNav}
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
              description="When employees submit expense reports, they will appear here for your review."
              action={
                <Button variant="outline" asChild>
                  <Link to="/manager/reports">Refresh</Link>
                </Button>
              }
            />
          )}
        </DashboardPanel>
      </div>
    </DashboardLayout>
  )
}
