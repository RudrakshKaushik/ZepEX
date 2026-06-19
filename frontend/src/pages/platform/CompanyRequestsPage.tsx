import { Building2, Check, ClipboardList, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  approveCompanyRequest,
  listCompanyRequests,
  rejectCompanyRequest,
} from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { AdminListPanel } from '@/components/admin/AdminListPanel'
import { StatusBadge } from '@/components/StatusBadge'
import { DashboardLayout, platformNavWithAudit } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/ui/spinner'
import type { CompanyRegistrationRequest } from '@/types'
import { formatDateTime } from '@/lib/utils'

export function CompanyRequestsPage() {
  const [requests, setRequests] = useState<CompanyRegistrationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await listCompanyRequests()
      setRequests(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleApprove = async (id: number) => {
    setActionId(id)
    setError('')
    setMessage('')
    try {
      const { data } = await approveCompanyRequest(id)
      setMessage(
        `Approved! Admin: ${data.admin_email} · Temp password: ${data.temporary_password}`,
      )
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setActionId(null)
    }
  }

  const handleReject = async (id: number) => {
    setActionId(id)
    setError('')
    setMessage('')
    try {
      await rejectCompanyRequest(id)
      setMessage('Request rejected.')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setActionId(null)
    }
  }

  if (loading) return <PageLoader />

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length

  return (
    <DashboardLayout
      portal="platform"
      title="Company Requests"
      subtitle="Review and approve registrations"
      breadcrumb="Company Requests"
      icon={ClipboardList}
      navItems={platformNavWithAudit}
    >
      {message && (
        <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <AdminListPanel
        title="Registration Requests"
        count={requests.length}
        description={`${pendingCount} request(s) awaiting your review.`}
      >
        {requests.length === 0 ? (
          <p className="px-5 py-8 text-sm text-gray-400 sm:px-6">No registration requests.</p>
        ) : (
          <ul className="divide-y divide-[#e2e8f0]">
            {requests.map((req) => (
              <li key={req.id} className="px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Building2 className="h-4 w-4 shrink-0 text-primary" />
                      <h3 className="font-semibold text-gray-900">{req.company_name}</h3>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{req.company_domain}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {req.admin_name} · {req.admin_email}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Submitted {formatDateTime(req.created_at)}
                    </p>
                  </div>
                  {req.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="success"
                        disabled={actionId === req.id}
                        onClick={() => handleApprove(req.id)}
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={actionId === req.id}
                        onClick={() => handleReject(req.id)}
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminListPanel>
    </DashboardLayout>
  )
}
