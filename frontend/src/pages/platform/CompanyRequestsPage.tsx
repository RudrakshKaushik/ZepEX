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
import { RejectCompanyRequestDialog } from '@/components/platform/RejectCompanyRequestDialog'
import { DashboardLayout, platformNavWithAudit } from '@/components/layout/DashboardLayout'
import type { CompanyRegistrationRequest } from '@/types'
import { toast } from '@/lib/toast'

export function CompanyRequestsPage() {
  const [requests, setRequests] = useState<CompanyRegistrationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<number | null>(null)
  const [rejectTarget, setRejectTarget] = useState<CompanyRegistrationRequest | null>(null)
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
        `Approved ${data.admin_email}. Welcome email sent with login credentials. Temp password: ${data.temporary_password}`,
      )
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setActionId(null)
    }
  }

  const handleRejectClick = (id: number) => {
    const request = requests.find((item) => item.id === id) ?? null
    setRejectTarget(request)
  }

  const handleRejectConfirm = async (id: number, rejectReason: string) => {
    setActionId(id)
    setError('')
    try {
      const { data } = await rejectCompanyRequest(id, rejectReason)
      setRejectTarget(null)
      toast.success(
        `Rejected ${data.company_name}. Notification email sent to ${data.admin_email}.`,
      )
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
              . Approving or rejecting sends an email to the applicant.
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
                  onReject={handleRejectClick}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <RejectCompanyRequestDialog
        request={rejectTarget}
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open && actionId === null) {
            setRejectTarget(null)
          }
        }}
        onConfirm={handleRejectConfirm}
        loading={actionId !== null}
      />
    </DashboardLayout>
  )
}
