import { Banknote, Check, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { ReportDetail } from '@/components/ReportDetail'
import { ExpenseReportTable } from '@/components/reports/ExpenseReportTable'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { QueuedReport } from '@/lib/reportQueue'

interface ReportQueueTableProps {
  items: QueuedReport[]
  actionId: string | null
  notes: Record<string, string>
  onNotesChange: (reportId: string, value: string) => void
  onApprove?: (reportId: string) => void
  onReject?: (reportId: string) => void
  onMarkPaid?: (reportId: string) => void
}

export function ReportQueueTable({
  items,
  actionId,
  notes,
  onNotesChange,
  onApprove,
  onReject,
  onMarkPaid,
}: ReportQueueTableProps) {
  return (
    <ExpenseReportTable
      reports={items.map((item) => item.report)}
      renderExpanded={(report) => {
        const item = items.find((entry) => entry.report.id === report.id)
        if (!item) return null

        const showApprovalActions =
          item.queueKind === 'approval_pending' && onApprove && onReject
        const showPaymentActions = item.queueKind === 'payment_pending' && onMarkPaid

        return (
          <ExpandedReportPanel
            report={report}
            notes={notes[report.id] || ''}
            onNotesChange={(value) => onNotesChange(report.id, value)}
            showApprovalActions={Boolean(showApprovalActions)}
            showPaymentActions={Boolean(showPaymentActions)}
            actionId={actionId}
            onApprove={onApprove}
            onReject={onReject}
            onMarkPaid={onMarkPaid}
          />
        )
      }}
    />
  )
}

function ExpandedReportPanel({
  report,
  notes,
  onNotesChange,
  showApprovalActions,
  showPaymentActions,
  actionId,
  onApprove,
  onReject,
  onMarkPaid,
}: {
  report: QueuedReport['report']
  notes: string
  onNotesChange: (value: string) => void
  showApprovalActions: boolean
  showPaymentActions: boolean
  actionId: string | null
  onApprove?: (reportId: string) => void
  onReject?: (reportId: string) => void
  onMarkPaid?: (reportId: string) => void
}) {
  let actions: ReactNode = null

  if (showApprovalActions) {
    actions = (
      <div className="space-y-3">
        <Textarea
          placeholder="Notes (required for rejection)"
          value={notes}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onNotesChange(e.target.value)}
        />
        <div className="flex gap-2">
          <Button
            variant="success"
            disabled={actionId === report.id}
            onClick={(e) => {
              e.stopPropagation()
              onApprove?.(report.id)
            }}
          >
            <Check className="h-4 w-4" />
            Approve
          </Button>
          <Button
            variant="destructive"
            disabled={actionId === report.id}
            onClick={(e) => {
              e.stopPropagation()
              onReject?.(report.id)
            }}
          >
            <X className="h-4 w-4" />
            Reject
          </Button>
        </div>
      </div>
    )
  } else if (showPaymentActions) {
    actions = (
      <div className="space-y-3">
        <Textarea
          placeholder="Payment notes (optional)"
          value={notes}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onNotesChange(e.target.value)}
        />
        <Button
          disabled={actionId === report.id}
          onClick={(e) => {
            e.stopPropagation()
            onMarkPaid?.(report.id)
          }}
        >
          <Banknote className="h-4 w-4" />
          Mark as paid
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ReportDetail report={report} showEmployee={false} />
      {actions}
    </div>
  )
}
