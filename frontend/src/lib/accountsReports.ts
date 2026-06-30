import { getPaymentDashboard } from '@/api'
import type { PaymentDashboardResponse } from '@/types'

export type AccountsDashboardData = PaymentDashboardResponse

export async function loadApprovedReportsForPayment(): Promise<{
  payment: AccountsDashboardData
  approvedReports: AccountsDashboardData['approved_reports']
}> {
  const { data } = await getPaymentDashboard()
  return {
    payment: data,
    approvedReports: data.approved_reports ?? [],
  }
}
