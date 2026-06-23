import type { ExpenseReport, Receipt } from '@/types'

type CurrentMonthReportResponse = Partial<ExpenseReport> & {
  report_id?: string
  no_violation_receipts?: Receipt[]
  violation_receipts?: Receipt[]
}

export function normalizeCurrentMonthReport(data: CurrentMonthReportResponse): ExpenseReport {
  const receipts = data.receipts?.length
    ? data.receipts
    : [...(data.no_violation_receipts ?? []), ...(data.violation_receipts ?? [])]

  return {
    ...data,
    id: data.id ?? data.report_id ?? '',
    receipts,
    workflow_timeline: data.workflow_timeline ?? [],
  } as ExpenseReport
}
