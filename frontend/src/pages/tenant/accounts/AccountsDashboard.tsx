import { CheckCircle2, Clock, DollarSign, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState'
import { DashboardPanel } from '@/components/dashboard/DashboardPanel'
import { DashboardReportList } from '@/components/dashboard/DashboardReportList'
import { MetricCard } from '@/components/MetricCard'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/ui/spinner'
import { useAuth } from '@/context/AuthContext'
import { buildAccountsNav } from '@/lib/rolePermissions'
import { loadApprovedReportsForPayment } from '@/lib/accountsReports'
import type { ExpenseReport } from '@/types'
import { formatCurrency } from '@/lib/utils'

export function AccountsDashboard() {
  const { user } = useAuth()
  const navItems = buildAccountsNav(user)
  const [payment, setPayment] = useState<Awaited<ReturnType<typeof loadApprovedReportsForPayment>>['payment'] | null>(null)
  const [approvedReports, setApprovedReports] = useState<ExpenseReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadApprovedReportsForPayment()
      .then((data) => {
        setPayment(data.payment)
        setApprovedReports(data.approvedReports)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

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
        <DashboardPanel
          title="Approved Reports"
          action={
            <Button asChild>
              <Link to="/accounts/reports">Mark as paid</Link>
            </Button>
          }
        >
          {approvedReports.length > 0 ? (
            <DashboardReportList
              reports={approvedReports.slice(0, 5)}
              viewTo={() => '/accounts/reports'}
            />
          ) : (
            <DashboardEmptyState
              image="folder"
              title="No approved reports yet"
              description="Manager-approved expense reports will appear here ready for payment. Ensure your workflow ends with the manager step so reports are fully approved before they reach Accounts."
            />
          )}
        </DashboardPanel>

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
