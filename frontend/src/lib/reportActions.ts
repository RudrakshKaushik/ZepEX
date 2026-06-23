import { toast } from '@/lib/toast'
import type {
  ApproveReportResponse,
  MarkPaidReportResponse,
  RejectReportResponse,
} from '@/types'

export function showReportActionToast(
  data: ApproveReportResponse | RejectReportResponse | MarkPaidReportResponse,
) {
  const suffix = data.is_company_admin_override ? ' · Company Admin Override' : ''
  toast.success(`${data.message}${suffix}`)
}
