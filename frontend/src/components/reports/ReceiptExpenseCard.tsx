import { AlertTriangle, FileText, RefreshCw, Trash2 } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Receipt } from '@/types'
import { formatDate } from '@/lib/utils'
import {
  formatLineItemAmount,
  formatReceiptAmountDisplay,
  receiptExchangeRateHint,
} from '@/lib/receiptDisplay'
import {
  canRetryReceiptAi,
  isAiExtractionFailed,
  isAiExtractionPending,
  receiptAiStatusLabel,
  receiptDisplayTitle,
} from '@/lib/receiptAi'

function violationTags(receipt: Receipt) {
  const tags: string[] = []
  if (receipt.has_duplicate_violation) tags.push('Duplicate receipt')
  if (receipt.has_old_bill_violation) tags.push('Old bill')
  if (receipt.has_amount_violation) tags.push('Over policy limit')
  return tags
}

function violationLines(receipt: Receipt): string[] {
  if (!receipt.policy_violation_reason) return []
  return receipt.policy_violation_reason
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

interface ReceiptExpenseCardProps {
  receipt: Receipt
  canEdit?: boolean
  onDeleteLineItem?: (lineItemId: string) => void
  onRetryReceipt?: (receiptId: string) => void
  retrying?: boolean
}

export function ReceiptExpenseCard({
  receipt,
  canEdit = false,
  onDeleteLineItem,
  onRetryReceipt,
  retrying = false,
}: ReceiptExpenseCardProps) {
  const hasLineItems = receipt.line_items.length > 0
  const tags = violationTags(receipt)
  const violations = violationLines(receipt)
  const rateHint = receiptExchangeRateHint(receipt)
  const showOriginalAmount =
    hasLineItems &&
    receipt.original_currency &&
    receipt.company_currency &&
    receipt.original_currency !== receipt.company_currency
  const showViolations = hasLineItems && receipt.has_any_violation

  return (
    <article className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-[#e2e8f0] px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900">{receiptDisplayTitle(receipt)}</h3>
              {receipt.invoice_date && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Invoice date · {formatDate(receipt.invoice_date)}
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            {!hasLineItems ? (
              <span className="text-sm text-muted-foreground">All line items removed</span>
            ) : isAiExtractionFailed(receipt) ? (
              <span className="text-sm text-muted-foreground">Amount pending extraction</span>
            ) : (
              <>
                <span className="text-lg font-semibold text-gray-900">
                  {formatReceiptAmountDisplay(receipt)}
                </span>
                {showOriginalAmount && rateHint && (
                  <span className="text-xs text-muted-foreground">{rateHint}</span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {showViolations && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Policy issue
            </Badge>
          )}
          <StatusBadge status={receipt.status} />
          {canEdit && canRetryReceiptAi(receipt) && onRetryReceipt && (
            <Button
              size="sm"
              variant="outline"
              disabled={retrying}
              onClick={() => onRetryReceipt(receipt.id)}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${retrying ? 'animate-spin' : ''}`} />
              Retry AI
            </Button>
          )}
        </div>
      </header>

      {(receipt.ai_status && receipt.ai_status !== 'AI_COMPLETED') || isAiExtractionPending(receipt) ? (
        <div className="border-b border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900 sm:px-5">
          <div className="flex items-center gap-2 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
            </span>
            {isAiExtractionPending(receipt)
              ? 'Extracting vendor, amounts, and line items…'
              : `${receiptAiStatusLabel(receipt.ai_status)}${receipt.ai_error_message ? ` — ${receipt.ai_error_message}` : ''}`}
          </div>
        </div>
      ) : null}

      {showViolations && (violations.length > 0 || tags.length > 0) && (
        <div className="border-b border-amber-200 bg-amber-50/80 px-4 py-3 sm:px-5">
          {violations.length > 0 && (
            <ul className="space-y-1 text-sm text-amber-900">
              {violations.map((line) => (
                <li key={line} className="flex gap-2">
                  <span className="text-amber-600">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          )}
          {tags.length > 0 && (
            <div className={`flex flex-wrap gap-1.5 ${violations.length > 0 ? 'mt-2' : ''}`}>
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="border-amber-300 bg-white text-amber-900">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="px-4 py-4 sm:px-5">
        {receipt.line_items.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-[#e2e8f0]">
            <table className="w-full min-w-[32rem] text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Category</th>
                  <th className="px-3 py-2.5 font-medium">Description</th>
                  <th className="px-3 py-2.5 font-medium text-right">Amount</th>
                  <th className="px-3 py-2.5 font-medium">Date</th>
                  {canEdit && <th className="w-10 px-2 py-2.5" aria-label="Actions" />}
                </tr>
              </thead>
              <tbody>
                {receipt.line_items.map((item) => (
                  <tr key={item.id} className="border-t border-[#e2e8f0]">
                    <td className="px-3 py-2.5 capitalize text-gray-900">
                      {item.category.replace(/_/g, ' ')}
                    </td>
                    <td className="max-w-[14rem] px-3 py-2.5 text-gray-600">
                      <span className="line-clamp-2">{item.description || '—'}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-gray-900">
                      {formatLineItemAmount(item, receipt)}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {item.bill_date ? formatDate(item.bill_date) : '—'}
                    </td>
                    {canEdit && onDeleteLineItem && (
                      <td className="px-2 py-2.5">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => onDeleteLineItem(item.id)}
                          aria-label="Remove line item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : isAiExtractionPending(receipt) ? (
          <div className="space-y-2 rounded-lg border border-dashed border-blue-200 bg-blue-50/50 px-4 py-6 text-center">
            <p className="text-sm font-medium text-blue-900">Reading your receipt</p>
            <p className="text-xs text-blue-700">
              Line items will appear here automatically when extraction finishes.
            </p>
          </div>
        ) : isAiExtractionFailed(receipt) ? (
          <p className="text-sm text-amber-700">
            {receipt.ai_error_message ||
              'Could not extract expense details. Retry AI or upload a clearer receipt.'}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No expenses on this receipt. Upload a new receipt or retry AI to extract again.
          </p>
        )}
      </div>
    </article>
  )
}
