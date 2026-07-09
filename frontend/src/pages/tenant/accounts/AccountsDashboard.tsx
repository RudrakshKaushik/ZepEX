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
  const [paymentQueueReports, setPaymentQueueReports] = useState<ExpenseReport[]>([])
  const [rejectedForAccounts, setRejectedForAccounts] = useState<ExpenseReport[]>([])
  const [pendingReports, setPendingReports] = useState<ExpenseReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAll() {
      setLoading(true)
      try {
        const paymentResult = await loadApprovedReportsForPayment()
        setPayment(paymentResult.payment)
        setPaymentQueueReports(paymentResult.paymentQueueReports)
        setRejectedForAccounts(paymentResult.rejectedReportsForAccounts)

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
          setPaymentQueueReports(paymentResult.paymentQueueReports)
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
          title="Payment queue"
          value={metrics?.payment_queue_reports ?? paymentQueueReports.length}
          icon={Clock}
          accent="orange"
        />
        <MetricCard
          title="Awaiting payment"
          value={metrics?.approved_reports_waiting_payment ?? 0}
          icon={Clock}
          accent="orange"
        />
        <MetricCard
          title="Rejected (accounts)"
          value={metrics?.rejected_reports_waiting_accounts_action ?? rejectedForAccounts.length}
          icon={FileText}
          accent="orange"
        />
        <MetricCard
          title="Paid amount"
          value={formatCurrency(String(metrics?.paid_amount ?? 0))}
          icon={DollarSign}
          accent="blue"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Auto-approved"
          value={metrics?.auto_approved_reports_waiting_payment ?? 0}
          icon={CheckCircle2}
          accent="green"
        />
        <MetricCard
          title="Manual approved"
          value={metrics?.manual_approved_reports_waiting_payment ?? 0}
          icon={FileText}
          accent="blue"
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
          accent="orange"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Approved awaiting payment"
          value={formatCurrency(String(metrics?.approved_amount ?? 0))}
          icon={Clock}
          accent="orange"
        />
        <MetricCard
          title="Rejected amount"
          value={formatCurrency(String(metrics?.rejected_amount ?? 0))}
          icon={FileText}
          accent="orange"
        />
      </div>

      <div className="mt-6 space-y-6">
        {canMarkPaid(user) && (
          <DashboardPanel
            title="Payment queue"
            action={
              <Button asChild>
                <Link to={approvedReportsPath('ACCOUNTS')}>View all</Link>
              </Button>
            }
          >
            {paymentQueueReports.length > 0 ? (
              <DashboardReportList
                reports={paymentQueueReports.slice(0, 5)}
                viewTo={() => approvedReportsPath('ACCOUNTS')}
              />
            ) : (
              <DashboardEmptyState
                image="folder"
                title="No reports in payment queue"
                description="Approved reports waiting to be marked as paid will appear here."
              />
            )}
          </DashboardPanel>
        )}

        {canMarkPaid(user) && rejectedForAccounts.length > 0 && (
          <DashboardPanel title="Rejected reports (accounts action)">
            <DashboardReportList reports={rejectedForAccounts.slice(0, 5)} />
          </DashboardPanel>
        )}

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

        {(payment?.department_payment_summary?.length ?? 0) > 0 && (
          <DashboardPanel title="Paid by department">
            <div className="divide-y divide-gray-100">
              {payment!.department_payment_summary!.map((row) => (
                <div
                  key={row.department}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <span className="font-medium text-gray-900">{row.department}</span>
                  <span className="text-gray-600">{formatCurrency(row.total_paid)}</span>
                </div>
              ))}
            </div>
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

        {(payment?.recent_auto_approved_reports?.length ?? 0) > 0 && (
          <DashboardPanel title="Recently auto-approved">
            <DashboardReportList reports={payment!.recent_auto_approved_reports!.slice(0, 5)} />
          </DashboardPanel>
        )}

        {(payment?.recent_manual_approved_reports?.length ?? 0) > 0 && (
          <DashboardPanel title="Recently manually approved">
            <DashboardReportList reports={payment!.recent_manual_approved_reports!.slice(0, 5)} />
          </DashboardPanel>
        )}
      </div>
    </DashboardLayout>
  )
}
