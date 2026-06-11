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
      subtitle="Review and approve new tenant registrations"
      navItems={[
        ...platformNav,
        { label: 'Audit Logs', to: '/platform/audit-logs', icon: ScrollText },
      ]}
    >
      {message && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All registration requests</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No registration requests.</p>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{req.company_name}</h3>
                      <StatusBadge status={req.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {req.company_domain} · Admin: {req.admin_name} ({req.admin_email})
                    </p>
                    <p className="text-xs text-muted-foreground">
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
