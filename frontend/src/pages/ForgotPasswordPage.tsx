import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import loginImg from '@/assets/login_img.png'
import { forgotPassword, resetPassword } from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { toast } from '@/lib/toast'
import logo from '@/assets/logo.png'

type Step = 'request' | 'reset'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('request')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data } = await forgotPassword(email)
      toast.success(data.message)
      setStep('reset')
      setOtp('')
      setNewPassword('')
      setConfirmPassword('')
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
      const { data } = await forgotPassword(email)
      toast.success(data.message)
      setOtp('')
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault()
    if (otp.trim().length !== 6) {
      setError('Enter the 6-digit OTP from your email.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const { data } = await resetPassword(email, otp.trim(), newPassword)
      navigate('/login', { state: { message: data.message } })
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
          {step === 'request'
            ? "Enter your email and we'll send you a reset OTP."
            : `Enter the OTP sent to ${email} and choose a new password.`}
        </p>
      </div>

      {step === 'request' ? (
        <form onSubmit={handleSendOtp} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
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
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="otp">OTP code</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code"
              className="h-11 tracking-[0.3em]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new_password">New password</Label>
            <PasswordInput
              id="new_password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm password</Label>
            <PasswordInput
              id="confirm_password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="h-11"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>
          )}

          <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset password'}
          </Button>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <button
              type="button"
              className="font-medium text-primary hover:underline disabled:opacity-50"
              disabled={loading}
              onClick={() => void handleResendOtp()}
            >
              Resend OTP
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground disabled:opacity-50"
              disabled={loading}
              onClick={() => {
                setStep('request')
                setError('')
                setOtp('')
                setNewPassword('')
                setConfirmPassword('')
              }}
            >
              Use a different email
            </button>
          </div>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthSplitLayout>
  )
}
