import { Shield } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiErrorMessage, useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import logo from '@/assets/logo.png'

export function PlatformLoginPage() {
  const { login, logout } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      const stored = localStorage.getItem('zepex_user')
      const user = stored ? JSON.parse(stored) : null
      if (user?.role !== 'PLATFORM_OWNER') {
        logout()
        setError('This account is not authorized for platform access.')
        return
      }
      navigate('/platform')
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-950">
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-2">
          <img src={logo} alt="ZepEX" className="h-full w-25" />
        </div>
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800/50 px-3 py-1 text-sm text-slate-300">
            <Shield className="h-4 w-4" />
            Internal access only
          </div>
          <h2 className="text-4xl font-bold leading-tight">
            Platform operations console
          </h2>
          <p className="mt-4 max-w-md text-slate-400">
            Approve company registrations, monitor tenants, and review platform audit logs.
          </p>
        </div>
        <p className="text-sm text-slate-500">Authorized personnel only</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card className="border-slate-800 bg-slate-900 text-white">
            <CardHeader>
              <CardTitle>Platform sign in</CardTitle>
              <CardDescription className="text-slate-400">
                Use your platform owner credentials.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-200">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="platform.admin@zepex.com"
                    className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-200">
                      Password
                    </Label>
                    <button
                      type="button"
                      className="text-xs text-slate-400 hover:text-slate-200"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="border-slate-700 bg-slate-800 text-white"
                  />
                </div>
                {error && (
                  <p className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign in to platform'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
