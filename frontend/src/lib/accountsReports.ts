import { getPaymentDashboard } from '@/api'
import type { ExpenseReport } from '@/types'

export interface AccountsDashboardData {
  payment_user: {
    name: string
    email: string
    company: string
    company_role: string
  }
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

export async function loadApprovedReportsForPayment(): Promise<{
  payment: AccountsDashboardData
  approvedReports: ExpenseReport[]
}> {
  const { data } = await getPaymentDashboard()
  const payment = data as AccountsDashboardData
  const approvedReports = (payment.approved_reports ?? []).filter(
    (report) => report.status === 'APPROVED',
  )

  return { payment, approvedReports }
}
