import { CheckCircle2, Clock, DollarSign, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPaymentDashboard } from '@/api'
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState'
import { DashboardPanel } from '@/components/dashboard/DashboardPanel'
import { DashboardReportList } from '@/components/dashboard/DashboardReportList'
import { MetricCard } from '@/components/MetricCard'
import { DashboardLayout, accountsNav } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/ui/spinner'
import type { ExpenseReport } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface PaymentDashboardData {
  payment_user: { name: string; email: string; company: string; company_role: string }
  metrics: {
    approved_reports_waiting_payment: number
    paid_reports: number
    rejected_reports: number
    approved_amount: string
    paid_amount: string
    rejected_amount: string
    payment_completion_rate: number
  }
  recent_paid_reports: ExpenseReport[]
  approved_reports: ExpenseReport[]
  paid_reports: ExpenseReport[]
}

export function AccountsDashboard() {
  const [data, setData] = useState<PaymentDashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPaymentDashboard()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const metrics = data?.metrics
  const awaitingPayment = (data?.approved_reports ?? []).filter((r) => r.status === 'APPROVED')
  const recentPaid = data?.recent_paid_reports ?? []

  return (
    <DashboardLayout
      title="Accounts Dashboard"
      breadcrumb="Accounts Dashboard"
      subtitle={data?.payment_user.company}
      navItems={accountsNav}
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
          {awaitingPayment.length > 0 ? (
            <DashboardReportList
              reports={awaitingPayment.slice(0, 5)}
              viewTo={() => '/accounts/reports'}
            />
          ) : (
            <DashboardEmptyState
              image="folder"
              title="No reports awaiting payment"
              description="Approved expense reports ready for payment will appear here."
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
