import { Link } from 'react-router-dom'
import type { AuditLogEntry } from '@/types'
import { AuditLogCards } from '@/components/audit/AuditLogCards'
import { Button } from '@/components/ui/button'

interface AdminAuditFeedProps {
  logs: AuditLogEntry[]
  showViewAll?: boolean
  viewAllTo?: string
}

export function AdminAuditFeed({
  logs,
  showViewAll = true,
  viewAllTo = '/admin/audit-logs',
}: AdminAuditFeedProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2e8f0] px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
          <p className="mt-0.5 text-xs text-gray-500">Latest company audit events</p>
        </div>
        {showViewAll && (
          <Button variant="outline" size="sm" asChild>
            <Link to={viewAllTo}>View all</Link>
          </Button>
        )}
      </div>
      <div className="p-4 sm:p-6">
        <AuditLogCards logs={logs} emptyMessage="No audit activity yet." />
      </div>
    </div>
  )
}
