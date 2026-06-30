import type { Receipt } from '@/types'
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
  return `Rate: 1 ${from} = ${receipt.exchange_rate} ${to}${provider}`
}
