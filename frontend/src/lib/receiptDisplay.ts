import type { ExpenseReport, Receipt } from '@/types'
import { formatCurrency } from '@/lib/utils'

export function formatReceiptAmountDisplay(receipt: Receipt): string {
  const originalAmount = receipt.original_amount ?? receipt.total_amount
  const originalCurrency = receipt.original_currency ?? receipt.currency
  const companyAmount = receipt.company_amount
  const companyCurrency = receipt.company_currency

  if (
    companyAmount &&
    companyCurrency &&
    (companyCurrency !== originalCurrency || companyAmount !== originalAmount)
  ) {
    return `${formatCurrency(originalAmount, originalCurrency)} → ${formatCurrency(companyAmount, companyCurrency)}`
  }

  return formatCurrency(originalAmount, originalCurrency)
}

export function receiptExchangeRateHint(receipt: Receipt): string | null {
  const from = receipt.original_currency ?? receipt.currency
  const to = receipt.company_currency
  if (!receipt.exchange_rate || !to || !from || from === to) return null
  const provider = receipt.exchange_rate_provider ? ` (${receipt.exchange_rate_provider})` : ''
  const date = receipt.exchange_rate_date
    ? ` · ${new Date(receipt.exchange_rate_date).toLocaleDateString()}`
    : ''
  return `Rate: 1 ${from} = ${receipt.exchange_rate} ${to}${provider}${date}`
}

export function receiptDisplayCurrency(receipt: Receipt): string {
  return receipt.company_currency ?? receipt.original_currency ?? receipt.currency
}

/** Report totals are summed in each receipt's company (reimbursement) currency. */
export function reportDisplayCurrency(report: ExpenseReport): string {
  for (const receipt of report.receipts ?? []) {
    if (receipt.company_currency) {
      return receipt.company_currency
    }
  }
  for (const receipt of report.receipts ?? []) {
    const currency = receipt.original_currency ?? receipt.currency
    if (currency) {
      return currency
    }
  }
  return 'INR'
}

export function formatReportTotal(report: ExpenseReport): string {
  return formatCurrency(report.total_amount, reportDisplayCurrency(report))
}

/** Line items are stored in the receipt's original currency; convert for display when totals were converted. */
export function lineItemDisplayAmount(
  item: { amount: string },
  receipt: Receipt,
): string {
  const originalAmount = receipt.original_amount
  const companyAmount = receipt.company_amount
  const originalCurrency = receipt.original_currency ?? receipt.currency
  const companyCurrency = receipt.company_currency

  if (
    !originalAmount ||
    !companyAmount ||
    !originalCurrency ||
    !companyCurrency ||
    originalCurrency === companyCurrency
  ) {
    return item.amount
  }

  const originalTotal = Number(originalAmount)
  if (!Number.isFinite(originalTotal) || originalTotal <= 0) {
    return item.amount
  }

  const converted = (Number(item.amount) / originalTotal) * Number(companyAmount)
  return String(converted)
}

export function formatLineItemAmount(item: { amount: string }, receipt: Receipt): string {
  return formatCurrency(lineItemDisplayAmount(item, receipt), receiptDisplayCurrency(receipt))
}

