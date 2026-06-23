import { Settings } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import {
  getReimbursementEmailConfig,
  getSmtpConfig,
  saveReimbursementEmailConfig,
  saveSmtpConfig,
  triggerEmailFetch,
} from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAdminNav, invalidateAdminSetupCache } from '@/hooks/useAdminNav'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { FormPageShimmer } from '@/components/ui/shimmer'
import { toast } from '@/lib/toast'

export function SettingsPage() {
  const { navItems } = useAdminNav()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [emailForm, setEmailForm] = useState({
    email_address: '',
    imap_host: 'imap.gmail.com',
    imap_port: '993',
    imap_username: '',
    imap_password: '',
    is_active: true,
  })
  const [smtpForm, setSmtpForm] = useState({
    smtp_host: '',
    smtp_port: '587',
    smtp_email: '',
    smtp_password: '',
    from_email_name: 'ZepEx Notifications',
    use_tls: true,
    is_active: true,
  })

  useEffect(() => {
    Promise.all([getReimbursementEmailConfig(), getSmtpConfig()])
      .then(([emailRes, smtpRes]) => {
        const emailData = emailRes.data
        if ('email_address' in emailData) {
          setEmailForm((f) => ({
            ...f,
            email_address: emailData.email_address,
            imap_host: emailData.imap_host,
            imap_port: String(emailData.imap_port),
            imap_username: emailData.imap_username,
          }))
        }
        const smtpData = smtpRes.data
        if ('smtp_host' in smtpData) {
          setSmtpForm((f) => ({
            ...f,
            smtp_host: smtpData.smtp_host,
            smtp_port: String(smtpData.smtp_port),
            smtp_email: smtpData.smtp_email,
            from_email_name: smtpData.from_email_name,
            use_tls: smtpData.use_tls,
            is_active: smtpData.is_active,
          }))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const saveEmail = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await saveReimbursementEmailConfig({
        ...emailForm,
        imap_port: parseInt(emailForm.imap_port, 10),
      })
      toast.success('Reimbursement email config saved.')
      invalidateAdminSetupCache()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const saveSmtp = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await saveSmtpConfig({
        ...smtpForm,
        smtp_port: parseInt(smtpForm.smtp_port, 10),
      })
      toast.success('SMTP config saved.')
      invalidateAdminSetupCache()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const fetchEmails = async () => {
    setSaving(true)
    setError('')
    try {
      const { data } = await triggerEmailFetch()
      toast.success(
        `Processed ${data.processed_count} emails (${data.skipped_count} skipped).`,
      )
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout
        title="Settings"
        subtitle="Email ingestion & notifications"
        breadcrumb="Settings"
        icon={Settings}
        navItems={navItems}
      >
        <div className="grid gap-6 xl:grid-cols-2">
          <FormPageShimmer fields={5} />
          <FormPageShimmer fields={5} />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Settings"
      subtitle="Email ingestion & notifications"
      breadcrumb="Settings"
      icon={Settings}
      navItems={navItems}
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="flex h-full flex-col rounded-xl border border-[#e2e8f0] bg-white shadow-sm">
          <CardHeader className="border-b border-[#e2e8f0] px-5 py-5 sm:px-6">
            <CardTitle>Reimbursement email (IMAP)</CardTitle>
            <CardDescription>Fetch expense receipts from a shared inbox.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col px-5 py-5 sm:px-6 sm:py-6">
            <form onSubmit={saveEmail} className="flex flex-1 flex-col gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="imap-email">Email address</Label>
                  <Input
                    id="imap-email"
                    type="email"
                    value={emailForm.email_address}
                    onChange={(e) => setEmailForm({ ...emailForm, email_address: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
                  <div className="space-y-2">
                    <Label htmlFor="imap-host">IMAP host</Label>
                    <Input
                      id="imap-host"
                      value={emailForm.imap_host}
                      onChange={(e) => setEmailForm({ ...emailForm, imap_host: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imap-port">Port</Label>
                    <Input
                      id="imap-port"
                      inputMode="numeric"
                      value={emailForm.imap_port}
                      onChange={(e) => setEmailForm({ ...emailForm, imap_port: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imap-username">Username</Label>
                  <Input
                    id="imap-username"
                    value={emailForm.imap_username}
                    onChange={(e) => setEmailForm({ ...emailForm, imap_username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imap-password">Password / app password</Label>
                  <PasswordInput
                    id="imap-password"
                    value={emailForm.imap_password}
                    onChange={(e) => setEmailForm({ ...emailForm, imap_password: e.target.value })}
                    placeholder="Enter app password"
                  />
                </div>
              </div>

              <div className="mt-auto flex flex-wrap gap-3 border-t border-[#e2e8f0] pt-5">
                <Button type="submit" disabled={saving}>
                  Save email config
                </Button>
                <Button type="button" variant="outline" onClick={fetchEmails} disabled={saving}>
                  Trigger email fetch
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="flex h-full flex-col rounded-xl border border-[#e2e8f0] bg-white shadow-sm">
          <CardHeader className="border-b border-[#e2e8f0] px-5 py-5 sm:px-6">
            <CardTitle>SMTP notifications</CardTitle>
            <CardDescription>Outgoing email for status updates.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col px-5 py-5 sm:px-6 sm:py-6">
            <form onSubmit={saveSmtp} className="flex flex-1 flex-col gap-4">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-host">SMTP host</Label>
                    <Input
                      id="smtp-host"
                      value={smtpForm.smtp_host}
                      onChange={(e) => setSmtpForm({ ...smtpForm, smtp_host: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">Port</Label>
                    <Input
                      id="smtp-port"
                      inputMode="numeric"
                      value={smtpForm.smtp_port}
                      onChange={(e) => setSmtpForm({ ...smtpForm, smtp_port: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-email">SMTP email</Label>
                  <Input
                    id="smtp-email"
                    type="email"
                    value={smtpForm.smtp_email}
                    onChange={(e) => setSmtpForm({ ...smtpForm, smtp_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-password">Password</Label>
                  <PasswordInput
                    id="smtp-password"
                    value={smtpForm.smtp_password}
                    onChange={(e) => setSmtpForm({ ...smtpForm, smtp_password: e.target.value })}
                    placeholder="Enter SMTP password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-from-name">From name</Label>
                  <Input
                    id="smtp-from-name"
                    value={smtpForm.from_email_name}
                    onChange={(e) =>
                      setSmtpForm({ ...smtpForm, from_email_name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="mt-auto border-t border-[#e2e8f0] pt-5">
                <Button type="submit" disabled={saving}>
                  Save SMTP config
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
