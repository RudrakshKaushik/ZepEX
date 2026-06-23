import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { WorkflowStepper } from '@/components/reports/WorkflowStepper'
import { UserAvatar } from '@/components/ui/user-avatar'
import { formatDate } from '@/lib/utils'
import type { ExpenseReport } from '@/types'

interface ExpenseReportTableProps {
  reports: ExpenseReport[]
  renderExpanded: (report: ExpenseReport) => ReactNode
  defaultExpandedId?: string | null
}

export function ExpenseReportTable({
  reports,
  renderExpanded,
  defaultExpandedId = null,
}: ExpenseReportTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(defaultExpandedId)

  if (!reports.length) return null

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="w-full min-w-[48rem] text-sm">
        <thead>
          <tr className="bg-[#edf2f7] text-left text-sm font-semibold text-gray-700">
            <th className="w-10 px-3 py-3" aria-label="Expand" />
            <th className="px-4 py-3">Employee</th>
            <th className="px-4 py-3">Department</th>
            <th className="px-4 py-3">Report month</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e2e8f0]">
          {reports.map((report) => {
            const expanded = expandedId === report.id
            return (
              <ExpenseReportRow
                key={report.id}
                report={report}
                expanded={expanded}
                onToggle={() => setExpandedId(expanded ? null : report.id)}
                renderExpanded={renderExpanded}
              />
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ExpenseReportRow({
  report,
  expanded,
  onToggle,
  renderExpanded,
}: {
  report: ExpenseReport
  expanded: boolean
  onToggle: () => void
  renderExpanded: (report: ExpenseReport) => ReactNode
}) {
  return (
    <>
      <tr
        className="cursor-pointer text-gray-700 transition-colors hover:bg-gray-50/80"
        onClick={onToggle}
      >
        <td className="px-3 py-3 text-muted-foreground">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </td>
        <td className="px-4 py-3 font-medium text-gray-900">
          <div className="flex items-center gap-3">
            <UserAvatar
              src={report.employee_profile_picture}
              name={report.employee_name}
              email={report.employee_email}
            />
            <div className="min-w-0">
              <p className="truncate">{report.employee_name || report.employee_email}</p>
              <p className="truncate text-xs font-normal text-gray-500">{report.employee_email}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">{report.department_name}</td>
        <td className="px-4 py-3">{formatDate(report.month)}</td>
        <td className="px-4 py-3">
          <WorkflowStepper timeline={report.workflow_timeline ?? []} />
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50/60">
          <td colSpan={5} className="px-4 py-5">
            <div onClick={(e) => e.stopPropagation()}>{renderExpanded(report)}</div>
          </td>
        </tr>
      )}
    </>
  )
}
