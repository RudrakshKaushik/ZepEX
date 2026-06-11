import { CheckCircle2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { registerCompany } from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    company_name: '',
    company_domain: '',
    admin_name: '',
    admin_email: '',
  })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await registerCompany(form)
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
    <AuthSplitLayout
      headline="Launch your company expense workspace."
      description="Register once and get an AI-powered platform for receipt capture, policy checks, and reimbursements — built for every role on your team."
    >
      <Card>
        <CardHeader>
          <CardTitle>Register your company</CardTitle>
          <CardDescription>
            Submit a registration request. Our team will review and approve your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="zepEX.com"
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
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit registration'}
            </Button>
          </form>
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
