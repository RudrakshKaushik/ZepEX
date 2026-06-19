import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ScrollText } from 'lucide-react'
import { getCompanyAuditLogs } from '@/api'
import { AdminListPanel } from '@/components/admin/AdminListPanel'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PageLoader } from '@/components/ui/spinner'
import { useAdminNav } from '@/hooks/useAdminNav'
import type { AuditLogEntry } from '@/types'
import { formatAuditMessage, formatDateTime } from '@/lib/utils'

function isErrorLog(log: AuditLogEntry) {
  const text = `${log.action} ${log.message}`.toUpperCase()
  return (
    text.includes('FAILED') ||
    text.includes('ERROR') ||
    text.includes('REJECTED') ||
    text.includes('DEACTIVATE')
  )
}

export function AuditLogsPage() {
  const { navItems, setupComplete, ready } = useAdminNav()
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) return
    if (!setupComplete) {
      setLoading(false)
      return
    }
    getCompanyAuditLogs()
      .then((res) => setLogs(res.data.results))
      .finally(() => setLoading(false))
  }, [ready, setupComplete])

  if (!ready || loading) return <PageLoader />

  if (!setupComplete) {
    return <Navigate to="/admin" replace />
  }

  return (
    <DashboardLayout
      title="Audit Logs"
      subtitle="Company activity trail"
      breadcrumb="Audit Logs"
      icon={ScrollText}
      navItems={navItems}
    >
      <AdminListPanel title="Activity Trail" count={logs.length}>
        {logs.length === 0 ? (
          <p className="px-5 py-8 text-sm text-gray-400 sm:px-6">No audit logs yet.</p>
        ) : (
          <ul className="divide-y divide-[#e2e8f0]">
            {logs.map((log) => (
              <li key={log.id} className="px-5 py-4 sm:px-6">
                <p
                  className={`text-sm font-medium ${
                    isErrorLog(log) ? 'text-red-600' : 'text-[#16a34a]'
                  }`}
                >
                  {formatAuditMessage(log.message) || log.action.replace(/_/g, ' ')}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {log.action_by_email} · {formatDateTime(log.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </AdminListPanel>
    </DashboardLayout>
  )
}
