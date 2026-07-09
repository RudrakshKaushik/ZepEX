import {
  getMyApprovedApprovals,
  getMyPendingApprovals,
  getPaymentDashboard,
} from '@/api'
import type { ApprovalReportFilters } from '@/lib/reportFilters'
import {
  applyClientReportFilters,
  hasApprovalFilters,
  toApprovalApiParams,
} from '@/lib/reportFilters'
import type { ExpenseReport } from '@/types'

export type ReportQueueKind =
  | 'approval_pending'
  | 'approval_completed'
  | 'payment_pending'
  | 'payment_completed'

export interface QueuedReport {
  report: ExpenseReport
  queueKind: ReportQueueKind
}

export async function loadApprovalPendingReports(
  filters?: ApprovalReportFilters,
): Promise<QueuedReport[]> {
  const { data } = await getMyPendingApprovals(toApprovalApiParams(filters ?? {}))
  return data.results.map((report) => ({
    report,
    queueKind: 'approval_pending',
  }))
}

export async function loadApprovalCompletedReports(
  filters?: ApprovalReportFilters,
): Promise<QueuedReport[]> {
  const { data } = await getMyApprovedApprovals(toApprovalApiParams(filters ?? {}))
  return data.results.map((report) => ({
    report,
    queueKind: 'approval_completed',
  }))
}

export async function loadPaymentPendingReports(): Promise<QueuedReport[]> {
  const { data } = await getPaymentDashboard()
  const reports =
    data.payment_queue_reports ??
    data.approved_reports ??
    []
  return reports.map((report: ExpenseReport) => ({
    report,
    queueKind: 'payment_pending',
  }))
}

export async function loadPaymentCompletedReports(): Promise<QueuedReport[]> {
  const { data } = await getPaymentDashboard()
  return (data.paid_reports ?? []).map((report: ExpenseReport) => ({
    report,
    queueKind: 'payment_completed',
  }))
}

export async function loadPendingQueueReports(options: {
  canApprove: boolean
  canMarkPaid: boolean
  filters?: ApprovalReportFilters
}): Promise<QueuedReport[]> {
  const loaders: Promise<QueuedReport[]>[] = []
  if (options.canApprove) loaders.push(loadApprovalPendingReports(options.filters))
  if (options.canMarkPaid) loaders.push(loadPaymentPendingReports())

  const groups = await Promise.all(loaders)
  const merged = dedupeQueuedReports(groups.flat())
  return filterQueuedReports(merged, options.filters)
}

export async function loadApprovedQueueReports(options: {
  canApprove: boolean
  canMarkPaid: boolean
  filters?: ApprovalReportFilters
}): Promise<QueuedReport[]> {
  const loaders: Promise<QueuedReport[]>[] = []
  if (options.canApprove) loaders.push(loadApprovalCompletedReports(options.filters))
  if (options.canMarkPaid) loaders.push(loadPaymentCompletedReports())

  const groups = await Promise.all(loaders)
  const merged = dedupeQueuedReports(groups.flat())
  return filterQueuedReports(merged, options.filters)
}

function filterQueuedReports(
  items: QueuedReport[],
  filters?: ApprovalReportFilters,
): QueuedReport[] {
  if (!filters || !hasApprovalFilters(filters)) return items
  const allowedIds = new Set(
    applyClientReportFilters(
      items.map((item) => item.report),
      filters,
    ).map((report) => report.id),
  )
  return items.filter((item) => allowedIds.has(item.report.id))
}

function dedupeQueuedReports(items: QueuedReport[]): QueuedReport[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.report.id)) return false
    seen.add(item.report.id)
    return true
  })
}
