import { CheckCircle2, Clock, FileText, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApproverDashboard } from '@/api'
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState'
import { DashboardPanel } from '@/components/dashboard/DashboardPanel'
import { DashboardReportList } from '@/components/dashboard/DashboardReportList'
import { MetricCard } from '@/components/MetricCard'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { DashboardPageShimmer } from '@/components/ui/shimmer'
import { useAuth } from '@/context/AuthContext'
import { buildManagerNav, canApproveExpense, canManageOwnExpenses, canMarkPaid } from '@/lib/rolePermissions'
import { approvedReportsPath, pendingReportsPath } from '@/lib/reportQueuePaths'
import { loadApprovedQueueReports, loadPendingQueueReports } from '@/lib/reportQueue'
import type { ExpenseReport } from '@/types'
import UploadIcon from '@/assets/Upload.png'

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
  const [approvedReports, setApprovedReports] = useState<ExpenseReport[]>([])
  const [pendingReports, setPendingReports] = useState<ExpenseReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const canApprove = canApproveExpense(user)
    const canPay = canMarkPaid(user)

    async function loadAll() {
      setLoading(true)
      try {
        if (canApprove) {
          const dashboardData = await getApproverDashboard().then((res) => res.data)
          setData(dashboardData)
        }

        if (canApprove || canPay) {
          const [pending, approved] = await Promise.all([
            loadPendingQueueReports({ canApprove, canMarkPaid: canPay }),
            loadApprovedQueueReports({ canApprove, canMarkPaid: canPay }),
          ])
          setPendingReports(pending.map((item) => item.report))
          setApprovedReports(approved.map((item) => item.report))
        }
      } finally {
        setLoading(false)
      }
    }

    loadAll()
  }, [user])

  if (loading) {
    return (
      <DashboardLayout
        title="Manager Dashboard"
        breadcrumb="Manager Dashboard"
        navItems={navItems}
      >
        <DashboardPageShimmer />
      </DashboardLayout>
    )
  }

  const metrics = data?.metrics
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
                  Upload receipt
                  <img src={UploadIcon} alt="Upload" className="w-6 h-6" />
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

      <div className="mt-6 space-y-6">
        {(canApproveExpense(user) || canMarkPaid(user)) && (
        <DashboardPanel
          title="Pending Reports"
          action={
            <Button asChild>
              <Link to={pendingReportsPath('MANAGER')}>View all</Link>
            </Button>
          }
        >
          {pendingReports.length > 0 ? (
            <DashboardReportList
              reports={pendingReports}
              viewTo={() => pendingReportsPath('MANAGER')}
            />
          ) : (
            <DashboardEmptyState
              image="folder"
              title="No pending reports"
              description="Reports waiting for your approval or payment action will appear here."
              action={
                <Button variant="outline" asChild>
                  <Link to={pendingReportsPath('MANAGER')}>View all reports</Link>
                </Button>
              }
            />
          )}
        </DashboardPanel>
        )}

        {(canApproveExpense(user) || canMarkPaid(user)) && (
        <DashboardPanel
          title="Approved Reports"
          action={
            <Button asChild variant="outline">
              <Link to={approvedReportsPath('MANAGER')}>View all</Link>
            </Button>
          }
        >
            {approvedReports.length > 0 ? (
              <DashboardReportList
                reports={approvedReports.slice(0, 5)}
                viewTo={() => approvedReportsPath('MANAGER')}
              />
            ) : (
              <DashboardEmptyState
                image="folder"
                title="No approved reports yet"
                description="Reports you have approved or marked as paid will appear here."
              />
            )}
        </DashboardPanel>
        )}
      </div>
    </DashboardLayout>
  )
}
