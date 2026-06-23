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
        <div className="grid gap-6 lg:grid-cols-2">
          <FormPageShimmer fields={4} />
          <FormPageShimmer fields={4} />
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reimbursement email (IMAP)</CardTitle>
            <CardDescription>Fetch expense receipts from a shared inbox.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveEmail} className="space-y-3">
              <div className="space-y-2">
                <Label>Email address</Label>
                <Input
                  value={emailForm.email_address}
                  onChange={(e) => setEmailForm({ ...emailForm, email_address: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>IMAP host</Label>
                  <Input
                    value={emailForm.imap_host}
                    onChange={(e) => setEmailForm({ ...emailForm, imap_host: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input
                    value={emailForm.imap_port}
                    onChange={(e) => setEmailForm({ ...emailForm, imap_port: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={emailForm.imap_username}
                  onChange={(e) => setEmailForm({ ...emailForm, imap_username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Password / app password</Label>
                <PasswordInput
                  value={emailForm.imap_password}
                  onChange={(e) => setEmailForm({ ...emailForm, imap_password: e.target.value })}
                />
              </div>
              <Button type="submit" disabled={saving}>
                Save email config
              </Button>
            </form>
            <Button variant="outline" className="mt-3" onClick={fetchEmails} disabled={saving}>
              Trigger email fetch
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SMTP notifications</CardTitle>
            <CardDescription>Outgoing email for status updates.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveSmtp} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>SMTP host</Label>
                  <Input
                    value={smtpForm.smtp_host}
                    onChange={(e) => setSmtpForm({ ...smtpForm, smtp_host: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input
                    value={smtpForm.smtp_port}
                    onChange={(e) => setSmtpForm({ ...smtpForm, smtp_port: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>SMTP email</Label>
                <Input
                  type="email"
                  value={smtpForm.smtp_email}
                  onChange={(e) => setSmtpForm({ ...smtpForm, smtp_email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <PasswordInput
                  value={smtpForm.smtp_password}
                  onChange={(e) => setSmtpForm({ ...smtpForm, smtp_password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>From name</Label>
                <Input
                  value={smtpForm.from_email_name}
                  onChange={(e) =>
                    setSmtpForm({ ...smtpForm, from_email_name: e.target.value })
                  }
                />
              </div>
              <Button type="submit" disabled={saving}>
                Save SMTP config
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
