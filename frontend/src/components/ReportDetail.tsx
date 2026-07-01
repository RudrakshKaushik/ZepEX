import { AlertTriangle, FileText } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { CompanyAdminOverrideBadge } from '@/components/reports/CompanyAdminOverrideBadge'
import { WorkflowTimeline } from '@/components/reports/WorkflowTimeline'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserAvatar } from '@/components/ui/user-avatar'
import type { ExpenseReport } from '@/types'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import {
  formatReceiptAmountDisplay,
  receiptDisplayCurrency,
  receiptExchangeRateHint,
} from '@/lib/receiptDisplay'
import { receiptAiStatusLabel } from '@/lib/receiptAi'

interface ReportDetailProps {
  report: ExpenseReport
  showEmployee?: boolean
  showAdminOverride?: boolean
}

function approvalTypeLabel(approvalType: string | null | undefined): string | null {
  if (!approvalType) return null
  const labels: Record<string, string> = {
    SYSTEM_AUTO_APPROVED: 'System auto-approved',
    MANUAL_APPROVED: 'Manually approved',
    MANUAL_APPROVAL_REQUIRED: 'Manual approval required',
    REJECTED: 'Rejected',
    NOT_SUBMITTED: 'Not submitted',
  }
  return labels[approvalType] ?? approvalType.replace(/_/g, ' ').toLowerCase()
}

export function ReportDetail({
  report,
  showEmployee = true,
  showAdminOverride = false,
}: ReportDetailProps) {
  const approvalLabel = approvalTypeLabel(report.approval_type)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={report.status} />
        {report.is_auto_approved && (
          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800">
            Auto-approved
          </Badge>
        )}
        {approvalLabel && !report.is_auto_approved && (
          <Badge variant="outline" className="capitalize">
            {approvalLabel}
          </Badge>
        )}
        {showAdminOverride && <CompanyAdminOverrideBadge />}
        {showEmployee && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserAvatar
              src={report.employee_profile_picture}
              name={report.employee_name}
              email={report.employee_email}
              size="sm"
            />
            <span>{report.employee_name || report.employee_email}</span>
          </div>
        )}
        <span className="text-sm text-muted-foreground">
          {report.department_name} · {formatDate(report.month)}
        </span>
      </div>

      {report.workflow_timeline && report.workflow_timeline.length > 0 && (
        <WorkflowTimeline timeline={report.workflow_timeline} />
      )}

      <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-muted-foreground">Submitted</p>
          <p className="font-medium">{formatDateTime(report.submitted_at)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Auto-approved</p>
          <p className="font-medium">{formatDateTime(report.auto_approved_at)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Total amount</p>
          <p className="font-medium">{formatCurrency(report.total_amount)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Paid at</p>
          <p className="font-medium">{formatDateTime(report.paid_at)}</p>
        </div>
      </div>

      {report.latest_rejection_reason && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          <p className="font-medium">
            Rejected by {report.latest_rejection_reason.rejected_by} (
            {report.latest_rejection_reason.role})
          </p>
          <p className="mt-1">{report.latest_rejection_reason.reason}</p>
          <p className="mt-1 text-xs text-red-700">
            {formatDateTime(report.latest_rejection_reason.rejected_at)}
          </p>
        </div>
      )}

      {report.paid_notes && (
        <div className="rounded-lg bg-muted/60 p-4 text-sm">
          <p>
            <strong>Payment:</strong> {report.paid_notes}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {report.receipts.map((receipt) => (
          <Card key={receipt.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-primary" />
                  {receipt.vendor_name || 'Unknown vendor'}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  {receipt.has_any_violation && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Policy violation
                    </Badge>
                  )}
                  <StatusBadge status={receipt.status} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-4 text-sm">
                <span>{formatReceiptAmountDisplay(receipt)}</span>
                <span className="text-muted-foreground">{formatDate(receipt.invoice_date)}</span>
              </div>
              {receiptExchangeRateHint(receipt) && (
                <p className="text-xs text-muted-foreground">{receiptExchangeRateHint(receipt)}</p>
              )}
              {receipt.ai_status && receipt.ai_status !== 'AI_COMPLETED' && (
                <p className="text-xs text-amber-700">
                  AI: {receiptAiStatusLabel(receipt.ai_status)}
                  {receipt.ai_error_message ? ` — ${receipt.ai_error_message}` : ''}
                </p>
              )}

              {receipt.has_any_violation && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {receipt.policy_violation_reason && <p>{receipt.policy_violation_reason}</p>}
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    {receipt.has_duplicate_violation && (
                      <Badge variant="outline">Duplicate receipt</Badge>
                    )}
                    {receipt.has_old_bill_violation && (
                      <Badge variant="outline">Old bill</Badge>
                    )}
                    {receipt.has_amount_violation && (
                      <Badge variant="outline">Amount limit</Badge>
                    )}
                  </div>
                </div>
              )}

              {receipt.line_items.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left">
                      <tr>
                        <th className="px-3 py-2 font-medium">Category</th>
                        <th className="px-3 py-2 font-medium">Description</th>
                        <th className="px-3 py-2 font-medium">Amount</th>
                        <th className="px-3 py-2 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receipt.line_items.map((item) => (
                        <tr key={item.id} className="border-t">
                          <td className="px-3 py-2 capitalize">{item.category.replace(/_/g, ' ')}</td>
                          <td className="max-w-xs truncate px-3 py-2">
                            <div>{item.description}</div>
                            {item.is_violating && item.violation_reason && (
                              <p className="mt-1 text-xs text-amber-700">{item.violation_reason}</p>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {formatCurrency(item.amount, receiptDisplayCurrency(receipt))}
                          </td>
                          <td className="px-3 py-2">{formatDate(item.bill_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No line items extracted yet.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
