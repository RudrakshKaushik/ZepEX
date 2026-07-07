import type { ExpenseReport, Receipt, UploadReceiptResponse } from '@/types'

type CurrentMonthReportResponse = Partial<ExpenseReport> & {
  report_id?: string
  no_violation_receipts?: Receipt[]
  violation_receipts?: Receipt[]
}

function reportReceipts(data: CurrentMonthReportResponse): Receipt[] {
  if (data.receipts?.length) {
    return data.receipts
  }
  return [...(data.no_violation_receipts ?? []), ...(data.violation_receipts ?? [])]
}

export function normalizeCurrentMonthReport(data: CurrentMonthReportResponse): ExpenseReport {
  return {
    ...data,
    id: String(data.id ?? data.report_id ?? ''),
    receipts: reportReceipts(data),
    workflow_timeline: data.workflow_timeline ?? [],
  } as ExpenseReport
}

function mergeReceiptsById(local: Receipt[], server: Receipt[]): Receipt[] {
  const byId = new Map(local.map((receipt) => [receipt.id, receipt]))
  for (const receipt of server) {
    byId.set(receipt.id, receipt)
  }
  return Array.from(byId.values())
}

export function mergeServerReportIntoReports(
  previous: ExpenseReport[],
  data: CurrentMonthReportResponse,
  userEmail?: string,
): ExpenseReport[] {
  const incoming = normalizeCurrentMonthReport(data)
  if (!incoming.id) {
    return previous
  }

  const normalized: ExpenseReport = {
    ...incoming,
    employee_email: incoming.employee_email || userEmail || '',
  }

  const existingIndex = previous.findIndex((report) => String(report.id) === String(normalized.id))
  if (existingIndex === -1) {
    return [normalized]
  }

  const existing = previous[existingIndex]
  const merged: ExpenseReport = {
    ...normalized,
    receipts: mergeReceiptsById(existing.receipts ?? [], normalized.receipts ?? []),
  }

  return previous.map((report, index) => (index === existingIndex ? merged : report))
}

function currentMonthDate(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
}

export function mergeUploadIntoReports(
  reports: ExpenseReport[],
  upload: UploadReceiptResponse,
  user: { email?: string; name?: string; department?: string },
): ExpenseReport[] {
  const reportId = String(upload.report_id)
  const receipt = { ...upload.receipt, line_items: upload.receipt.line_items ?? [] }
  const existing = reports.find((report) => String(report.id) === reportId)

  if (existing) {
    const receipts = existing.receipts?.some((item) => item.id === receipt.id)
      ? existing.receipts.map((item) => (item.id === receipt.id ? receipt : item))
      : [...(existing.receipts ?? []), receipt]

    return reports.map((report) =>
      String(report.id) === reportId ? { ...report, receipts } : report,
    )
  }

  const draftReport: ExpenseReport = {
    id: String(reportId),
    company: receipt.company,
    employee: receipt.employee,
    employee_email: user.email ?? receipt.employee_email,
    employee_name: user.name,
    department: receipt.department,
    department_name: user.department ?? receipt.department_name,
    month: currentMonthDate(),
    status: 'DRAFT',
    is_auto_approved: false,
    total_amount: '0',
    submitted_at: null,
    paid_at: null,
    workflow_timeline: [],
    workflow_completed: false,
    receipts: [{ ...receipt, line_items: receipt.line_items ?? [] }],
    created_at: receipt.created_at,
    updated_at: receipt.updated_at,
  }

  return [draftReport]
}
