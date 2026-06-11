import { AlertTriangle, FileText } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ExpenseReport } from '@/types'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'

interface ReportDetailProps {
  report: ExpenseReport
  showEmployee?: boolean
}

export function ReportDetail({ report, showEmployee = true }: ReportDetailProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={report.status} />
        {showEmployee && (
          <span className="text-sm text-muted-foreground">{report.employee_email}</span>
        )}
        <span className="text-sm text-muted-foreground">
          {report.department_name} · {formatDate(report.month)}
        </span>
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-muted-foreground">Submitted</p>
          <p className="font-medium">{formatDateTime(report.submitted_at)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Manager action</p>
          <p className="font-medium">{formatDateTime(report.manager_action_at)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Accounts action</p>
          <p className="font-medium">{formatDateTime(report.accounts_action_at)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Paid at</p>
          <p className="font-medium">{formatDateTime(report.paid_at)}</p>
        </div>
      </div>

      {(report.manager_notes || report.accounts_notes) && (
        <div className="rounded-lg bg-muted/60 p-4 text-sm">
          {report.manager_notes && <p><strong>Manager:</strong> {report.manager_notes}</p>}
          {report.accounts_notes && <p><strong>Accounts:</strong> {report.accounts_notes}</p>}
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
                <div className="flex items-center gap-2">
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
                <span>{formatCurrency(receipt.total_amount, receipt.currency)}</span>
                <span className="text-muted-foreground">{formatDate(receipt.invoice_date)}</span>
              </div>

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
                          <td className="max-w-xs truncate px-3 py-2">{item.description}</td>
                          <td className="px-3 py-2">{formatCurrency(item.amount, receipt.currency)}</td>
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
