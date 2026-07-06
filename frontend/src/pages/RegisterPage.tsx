import { CheckCircle2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { registerCompany, requestCompanyRegistrationOtp } from '@/api'
import { getApiErrorMessage } from '@/api/client'
import registerImg from '@/assets/register_img.png'
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import logo from '@/assets/logo.png'
import { toast } from '@/lib/toast'

type Step = 'details' | 'otp'

export function RegisterPage() {
  const [step, setStep] = useState<Step>('details')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [otp, setOtp] = useState('')
  const [form, setForm] = useState({
    company_name: '',
    company_domain: '',
    admin_name: '',
    admin_email: '',
    expected_employee_count: '',
  })

  const buildOtpPayload = () => {
    const expectedCount = Number(form.expected_employee_count)
    return {
      company_name: form.company_name.trim(),
      company_domain: form.company_domain.trim().toLowerCase(),
      admin_name: form.admin_name.trim(),
      admin_email: form.admin_email.trim().toLowerCase(),
      expected_employee_count: expectedCount,
    }
  }

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.admin_email.trim()) {
      setError('Admin email is required to send an OTP.')
      return
    }
    const expectedCount = Number(form.expected_employee_count)
    if (!Number.isFinite(expectedCount) || expectedCount < 1) {
      setError('Expected employee count must be at least 1.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data } = await requestCompanyRegistrationOtp(buildOtpPayload())
      toast.success(data.message || 'OTP sent successfully.')
      setStep('otp')
      setOtp('')
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await requestCompanyRegistrationOtp(buildOtpPayload())
      toast.success(data.message || 'OTP sent successfully.')
      setOtp('')
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (otp.trim().length !== 6) {
      setError('Enter the 6-digit OTP from your email.')
      return
    }
    const expectedCount = Number(form.expected_employee_count)
    if (!Number.isFinite(expectedCount) || expectedCount < 1) {
      setError('Expected employee count must be at least 1.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await registerCompany({
        company_name: form.company_name.trim(),
        company_domain: form.company_domain.trim(),
        admin_name: form.admin_name.trim(),
        admin_email: form.admin_email.trim().toLowerCase(),
        expected_employee_count: expectedCount,
        otp: otp.trim(),
      })
      setSuccess(true)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthSplitLayout
        headline="You're on the list."
        description="We'll review your registration and email admin credentials once your company workspace is approved."
      >
        <Card className="text-center">
          <CardContent className="px-6 pt-10 pb-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-xl font-semibold">Registration submitted</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your request is pending approval. You will receive admin credentials once approved.
            </p>
            <Link to="/login" className="mt-6 inline-block">
              <Button variant="outline">Go to sign in</Button>
            </Link>
          </CardContent>
        </Card>
      </AuthSplitLayout>
    )
  }

  return (
    <AuthSplitLayout heroImage={registerImg}>
      <Card>
        <CardHeader>
          <div className="mb-8 flex items-center gap-2">
            <img src={logo} alt="ZepEX" className="h-full w-25" />
          </div>
          <CardTitle>Register your company</CardTitle>
          <CardDescription>
            {step === 'details'
              ? 'Submit your company details. We will email a verification OTP to the admin address.'
              : `Enter the OTP sent to ${form.admin_email} to complete registration.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'details' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="company_name">Company name</Label>
                  <Input
                    id="company_name"
                    required
                    value={form.company_name}
                    onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                    placeholder="ZepEX Technologies"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="company_domain">Company domain</Label>
                  <Input
                    id="company_domain"
                    required
                    value={form.company_domain}
                    onChange={(e) => setForm({ ...form, company_domain: e.target.value })}
                    placeholder="zepex.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin_name">Admin name</Label>
                  <Input
                    id="admin_name"
                    required
                    value={form.admin_name}
                    onChange={(e) => setForm({ ...form, admin_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin_email">Admin email</Label>
                  <Input
                    id="admin_email"
                    type="email"
                    required
                    value={form.admin_email}
                    onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="expected_employee_count">Expected employee count</Label>
                  <Input
                    id="expected_employee_count"
                    type="number"
                    min={1}
                    required
                    value={form.expected_employee_count}
                    onChange={(e) =>
                      setForm({ ...form, expected_employee_count: e.target.value })
                    }
                    placeholder="25"
                  />
                </div>
              </div>
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send verification OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
                <p className="font-medium text-foreground">{form.company_name}</p>
                <p className="mt-1 text-muted-foreground">{form.company_domain}</p>
                <p className="mt-2 text-muted-foreground">
                  Admin: {form.admin_name} · {form.admin_email}
                </p>
                <p className="mt-1 text-muted-foreground">
                  Expected employees: {form.expected_employee_count}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="otp">Verification OTP</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit code"
                />
              </div>
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit registration'}
              </Button>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
                  onClick={() => {
                    setStep('details')
                    setError('')
                  }}
                >
                  Edit details
                </button>
                <button
                  type="button"
                  className="font-medium text-primary hover:underline disabled:opacity-50"
                  disabled={loading}
                  onClick={handleResendOtp}
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}
          <div className="mt-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Or
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthSplitLayout>
  )
}
