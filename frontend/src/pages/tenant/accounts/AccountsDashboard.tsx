import { CheckCircle2, Clock, DollarSign, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState'
import { DashboardPanel } from '@/components/dashboard/DashboardPanel'
import { DashboardReportList } from '@/components/dashboard/DashboardReportList'
import { MetricCard } from '@/components/MetricCard'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { DashboardPageShimmer } from '@/components/ui/shimmer'
import { useAuth } from '@/context/AuthContext'
import { buildAccountsNav, canApproveExpense, canMarkPaid } from '@/lib/rolePermissions'
import { approvedReportsPath, pendingReportsPath } from '@/lib/reportQueuePaths'
import { loadApprovedQueueReports, loadPendingQueueReports } from '@/lib/reportQueue'
import { loadApprovedReportsForPayment } from '@/lib/accountsReports'
import type { ExpenseReport } from '@/types'
import { formatCurrency } from '@/lib/utils'

export function AccountsDashboard() {
  const { user } = useAuth()
  const navItems = buildAccountsNav(user)
  const [payment, setPayment] = useState<Awaited<ReturnType<typeof loadApprovedReportsForPayment>>['payment'] | null>(null)
  const [approvedReports, setApprovedReports] = useState<ExpenseReport[]>([])
  const [pendingReports, setPendingReports] = useState<ExpenseReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      try {
        const paymentResult = await loadApprovedReportsForPayment()
        setPayment(paymentResult.payment)

        const canApprove = canApproveExpense(user)
        const canPay = canMarkPaid(user)

        if (canApprove || canPay) {
          const [pending, approved] = await Promise.all([
            loadPendingQueueReports({ canApprove, canMarkPaid: canPay }),
            loadApprovedQueueReports({ canApprove, canMarkPaid: canPay }),
          ])
          setPendingReports(pending.map((item) => item.report))
          setApprovedReports(approved.map((item) => item.report))
        } else {
          setApprovedReports(paymentResult.approvedReports)
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
        title="Accounts Dashboard"
        breadcrumb="Accounts Dashboard"
        navItems={navItems}
      >
        <DashboardPageShimmer />
      </DashboardLayout>
    )
  }

  const metrics = payment?.metrics
  const recentPaid = payment?.recent_paid_reports ?? []

  return (
    <DashboardLayout
      title="Accounts Dashboard"
      breadcrumb="Accounts Dashboard"
      subtitle={payment?.payment_user.company}
      navItems={navItems}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Awaiting payment"
          value={metrics?.approved_reports_waiting_payment ?? 0}
          icon={Clock}
          accent="orange"
        />
        <MetricCard
          title="Paid reports"
          value={metrics?.paid_reports ?? 0}
          icon={CheckCircle2}
          accent="green"
        />
        <MetricCard
          title="Completion rate"
          value={`${metrics?.payment_completion_rate ?? 0}%`}
          icon={FileText}
          accent="blue"
        />
        <MetricCard
          title="Paid amount"
          value={formatCurrency(String(metrics?.paid_amount ?? 0))}
          icon={DollarSign}
          accent="blue"
        />
      </div>

      <div className="mt-6 space-y-6">
        {(canApproveExpense(user) || canMarkPaid(user)) && (
          <DashboardPanel
            title="Pending Reports"
            action={
              <Button asChild variant="outline">
                <Link to={pendingReportsPath('ACCOUNTS')}>Review all</Link>
              </Button>
            }
          >
            {pendingReports.length > 0 ? (
              <DashboardReportList
                reports={pendingReports.slice(0, 5)}
                viewTo={() => pendingReportsPath('ACCOUNTS')}
              />
            ) : (
              <DashboardEmptyState
                image="folder"
                title="No pending reports"
                description="Reports waiting for your approval or payment action will appear here."
              />
            )}
          </DashboardPanel>
        )}

        {(canApproveExpense(user) || canMarkPaid(user)) && (
        <DashboardPanel
          title="Approved Reports"
          action={
            <Button asChild>
              <Link to={approvedReportsPath('ACCOUNTS')}>View all</Link>
            </Button>
          }
        >
          {approvedReports.length > 0 ? (
            <DashboardReportList
              reports={approvedReports.slice(0, 5)}
              viewTo={() => approvedReportsPath('ACCOUNTS')}
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

        <DashboardPanel title="Recently Paid">
          {recentPaid.length > 0 ? (
            <DashboardReportList reports={recentPaid.slice(0, 5)} />
          ) : (
            <DashboardEmptyState
              image="calendar"
              title="No paid reports yet"
              description="Completed reimbursements will be listed here once marked as paid."
            />
          )}
        </DashboardPanel>
      </div>
    </DashboardLayout>
  )
}
