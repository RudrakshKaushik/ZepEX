import { Link } from 'react-router-dom'
import type { ExpenseReport } from '@/types'
import { UserAvatar } from '@/components/ui/user-avatar'
import { formatCurrency, formatDate } from '@/lib/utils'

interface DashboardReportListProps {
  reports: ExpenseReport[]
  viewTo?: (reportId: string) => string
  showEmployee?: boolean
}

export function DashboardReportList({
  reports,
  viewTo,
  showEmployee = true,
}: DashboardReportListProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
            <th className="pb-3 pr-4 font-medium">Report</th>
            <th className="pb-3 pr-4 font-medium">Date</th>
            <th className="pb-3 pr-4 font-medium">Amount</th>
            <th className="pb-3 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {reports.map((report) => (
            <tr key={report.id} className="text-gray-700">
              <td className="py-4 pr-4">
                <div className="flex items-center gap-3">
                  {showEmployee ? (
                    <UserAvatar
                      src={report.employee_profile_picture}
                      name={report.employee_name}
                      email={report.employee_email}
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-sm font-semibold text-red-500">
                      {report.month.slice(5, 7)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">
                      {showEmployee
                        ? report.employee_name || report.employee_email
                        : `Report ${report.month.slice(0, 7)}`}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {showEmployee
                        ? report.employee_email
                        : report.department_name || 'No department'}
                    </p>
                  </div>
                </div>
              </td>
              <td className="py-4 pr-4 text-gray-500">
                {formatDate(report.submitted_at || report.month)}
              </td>
              <td className="py-4 pr-4 font-semibold text-gray-900">
                {formatCurrency(report.total_amount)}
              </td>
              <td className="py-4 text-right">
                {viewTo && (
                  <Link
                    to={viewTo(report.id)}
                    className="text-sm font-semibold text-primary hover:text-[#1d4ed8] hover:underline"
                  >
                    View
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
