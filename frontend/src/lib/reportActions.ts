import { toast } from '@/lib/toast'
import type {
  ApproveReportResponse,
  MarkPaidReportResponse,
  RejectReportResponse,
} from '@/types'

export type ReportActionKind = 'approve' | 'reject' | 'paid'

const EMAIL_NOTIFICATION_SUFFIX: Record<ReportActionKind, string> = {
  approve: ' The employee will be notified by email.',
  reject: ' The employee will be notified by email with the rejection reason.',
  paid: ' The employee will be notified by email.',
}

export function showReportActionToast(
  data: ApproveReportResponse | RejectReportResponse | MarkPaidReportResponse,
  kind: ReportActionKind,
) {
  const overrideSuffix = data.is_company_admin_override ? ' · Company Admin Override' : ''
  toast.success(`${data.message}${overrideSuffix}${EMAIL_NOTIFICATION_SUFFIX[kind]}`)
}
