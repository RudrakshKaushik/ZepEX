import { getPaymentDashboard } from '@/api'
import type { ExpenseReport, PaymentDashboardResponse } from '@/types'

export type AccountsDashboardData = PaymentDashboardResponse

export async function loadApprovedReportsForPayment(): Promise<{
  payment: AccountsDashboardData
  approvedReports: AccountsDashboardData['approved_reports']
  paymentQueueReports: ExpenseReport[]
  rejectedReportsForAccounts: ExpenseReport[]
}> {
  const { data } = await getPaymentDashboard()
  return {
    payment: data,
    approvedReports: data.approved_reports ?? [],
    paymentQueueReports:
      data.payment_queue_reports ??
      data.recent_payment_queue_reports ??
      data.approved_reports ??
      [],
    rejectedReportsForAccounts:
      data.rejected_reports_for_accounts ??
      data.recent_rejected_reports_for_accounts ??
      data.rejected_reports ??
      [],
  }
}
