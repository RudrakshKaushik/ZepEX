import { ClipboardList } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  approveCompanyRequest,
  listCompanyRequests,
  rejectCompanyRequest,
} from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { CompanyRequestCard } from '@/components/platform/CompanyRequestCard'
import { CompanyRequestCardsShimmer } from '@/components/platform/CompanyRequestCardsShimmer'
import { DashboardLayout, platformNavWithAudit } from '@/components/layout/DashboardLayout'
import type { CompanyRegistrationRequest } from '@/types'
import { toast } from '@/lib/toast'

export function CompanyRequestsPage() {
  const [requests, setRequests] = useState<CompanyRegistrationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)
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
    try {
      const { data } = await approveCompanyRequest(id)
      toast.success(
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
    try {
      await rejectCompanyRequest(id)
      toast.success('Request rejected.')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setActionId(null)
    }
  }

  const pendingCount = requests.filter((request) => request.status === 'PENDING').length
  const verifiedPendingCount = requests.filter(
    (request) =>
      request.status === 'PENDING' &&
      request.is_email_verified &&
      request.company_name !== 'PENDING',
  ).length

  return (
    <DashboardLayout
      portal="platform"
      title="Company Requests"
      subtitle="Review and approve registrations"
      breadcrumb="Company Requests"
      icon={ClipboardList}
      navItems={platformNavWithAudit}
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <CompanyRequestCardsShimmer />
      ) : (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Registration Requests ({requests.length})
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {verifiedPendingCount} request(s) ready for review
              {pendingCount > verifiedPendingCount
                ? ` · ${pendingCount - verifiedPendingCount} awaiting OTP verification`
                : ''}
              .
            </p>
          </div>

          {requests.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#e2e8f0] bg-white px-5 py-12 text-center text-sm text-gray-400">
              No registration requests.
            </p>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <CompanyRequestCard
                  key={request.id}
                  request={request}
                  actionId={actionId}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  )
}
