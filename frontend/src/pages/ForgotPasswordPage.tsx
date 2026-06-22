
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import loginImg from '@/assets/login_img.png'
import { forgotPassword } from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/lib/toast'
import logo from '@/assets/logo.png'
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await forgotPassword(email)
      toast.success(data.message)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthSplitLayout heroImage={loginImg}>
      <div className="mb-8 flex items-center gap-2">
        <img src={logo} alt="ZepEX" className="h-full w-25" />
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Forgot password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset OTP.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="h-11"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>
        )}

        <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
          {loading ? 'Sending...' : 'Send reset OTP'}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthSplitLayout>
  )
}
