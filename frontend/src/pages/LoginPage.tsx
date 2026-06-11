import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getApiErrorMessage, useAuth } from '@/context/AuthContext'
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginPage() {
  const { login, logout } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const redirect = await login(email, password)
      const stored = localStorage.getItem('zepex_user')
      const user = stored ? JSON.parse(stored) : null
      if (user?.role === 'PLATFORM_OWNER') {
        logout()
        setError('Platform accounts must sign in at /platform/login')
        return
      }
      navigate(redirect)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthSplitLayout
      headline="One login for every role in your expense workflow."
      description="Company admins, managers, employees, and accounts teams each land on their role-specific dashboard after sign-in."
    >
      <Card>
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in with your ZepEX account credentials.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New company?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Register here
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthSplitLayout>
  )
}
