import { StatusBadge } from '@/components/StatusBadge'
import { WorkflowTimeline } from '@/components/reports/WorkflowTimeline'
import type { ExpenseReport } from '@/types'
import { formatDate, formatDateTime } from '@/lib/utils'
import { formatReportTotal } from '@/lib/receiptDisplay'

interface EmployeeReportSummaryProps {
  report: ExpenseReport
}

export function EmployeeReportSummary({ report }: EmployeeReportSummaryProps) {
  const receiptCount = report.receipts?.length ?? 0
  const isDraft = report.status === 'DRAFT'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#e2e8f0] bg-white px-4 py-4 sm:px-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {isDraft ? 'Draft report' : 'Report'} · {formatDate(report.month)}
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">
            {formatReportTotal(report)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {receiptCount} receipt{receiptCount === 1 ? '' : 's'}
            {report.department_name ? ` · ${report.department_name}` : ''}
          </p>
        </div>
        <StatusBadge status={report.status} />
      </div>

      {!isDraft && report.workflow_timeline && report.workflow_timeline.length > 0 && (
        <div className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-4 sm:px-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Approval progress
          </p>
          <WorkflowTimeline timeline={report.workflow_timeline} />
        </div>
      )}

      {!isDraft && (
        <div className="grid gap-3 rounded-xl border border-[#e2e8f0] bg-white px-4 py-4 text-sm sm:grid-cols-3 sm:px-5">
          <div>
            <p className="text-muted-foreground">Submitted</p>
            <p className="font-medium">{formatDateTime(report.submitted_at) || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Auto-approved</p>
            <p className="font-medium">{formatDateTime(report.auto_approved_at) || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Paid</p>
            <p className="font-medium">{formatDateTime(report.paid_at) || '—'}</p>
          </div>
        </div>
      )}

      {report.latest_rejection_reason && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 sm:px-5">
          <p className="font-medium">
            Rejected by {report.latest_rejection_reason.rejected_by} (
            {report.latest_rejection_reason.role})
          </p>
          <p className="mt-1">{report.latest_rejection_reason.reason}</p>
        </div>
      )}
    </div>
  )
}
