import { Check, ScrollText, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  approveCompanyRequest,
  listCompanyRequests,
  rejectCompanyRequest,
} from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { StatusBadge } from '@/components/StatusBadge'
import { DashboardLayout, platformNav } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoader } from '@/components/ui/spinner'
import type { CompanyRegistrationRequest } from '@/types'
import { formatDateTime } from '@/lib/utils'

const platformNavWithAudit = [
  ...platformNav,
  { label: 'Audit Logs', to: '/platform/audit-logs', icon: ScrollText },
]

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

  return (
    <DashboardLayout
      portal="platform"
      title="Company Requests"
      subtitle="Review and approve registrations"
      navItems={platformNavWithAudit}
    >
      <div className="w-full max-w-full overflow-hidden">
        {message && (
          <div className="mb-4 break-words rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-800 sm:px-4">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 break-words rounded-lg bg-red-50 px-3 py-3 text-sm text-red-700 sm:px-4">
            {error}
          </div>
        )}

        <Card className="w-full max-w-full overflow-hidden">
          <CardHeader className="space-y-0 p-4 sm:p-6 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">All registration requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 sm:space-y-4 sm:p-6 sm:pt-0">
            {requests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No registration requests.</p>
            ) : (
              requests.map((req) => (
                <article
                  key={req.id}
                  className="w-full max-w-full overflow-hidden rounded-xl border p-3 sm:p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold sm:text-base">{req.company_name}</h3>
                    <StatusBadge status={req.status} />
                  </div>

                  <dl className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <div className="break-words">
                      <dt className="sr-only">Domain</dt>
                      <dd>{req.company_domain}</dd>
                    </div>
                    <div>
                      <dt className="sr-only">Admin</dt>
                      <dd>Admin: {req.admin_name}</dd>
                    </div>
                    <div className="break-all">
                      <dt className="sr-only">Email</dt>
                      <dd>{req.admin_email}</dd>
                    </div>
                    <div>
                      <dt className="sr-only">Submitted</dt>
                      <dd className="text-xs">Submitted {formatDateTime(req.created_at)}</dd>
                    </div>
                  </dl>

                  {req.status === 'PENDING' && (
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:w-fit">
                      <Button
                        size="sm"
                        variant="success"
                        className="w-full sm:w-auto"
                        disabled={actionId === req.id}
                        onClick={() => handleApprove(req.id)}
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-full sm:w-auto"
                        disabled={actionId === req.id}
                        onClick={() => handleReject(req.id)}
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </article>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
