import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { changePassword, editProfile, getProfile } from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageLoader } from '@/components/ui/spinner'
import { useAuth } from '@/context/AuthContext'
import { defaultHomeForUser } from '@/lib/auth'
import type { UserProfile } from '@/types'

export function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    address: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
  })
  const [pictureFile, setPictureFile] = useState<File | null>(null)

  useEffect(() => {
    getProfile()
      .then((res) => {
        setProfile(res.data)
        setProfileForm({
          first_name: res.data.first_name,
          last_name: res.data.last_name,
          phone_number: res.data.phone_number || '',
          address: res.data.address || '',
        })
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [])

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const data = new FormData()
      if (profileForm.first_name) data.append('first_name', profileForm.first_name)
      if (profileForm.last_name) data.append('last_name', profileForm.last_name)
      if (profileForm.phone_number) data.append('phone_number', profileForm.phone_number)
      if (profileForm.address) data.append('address', profileForm.address)
      if (pictureFile) data.append('profile_picture', pictureFile)
      await editProfile(data)
      setMessage('Profile updated successfully.')
      setPictureFile(null)
      const { data: updated } = await getProfile()
      setProfile(updated)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      await changePassword(passwordForm.old_password, passwordForm.new_password)
      setPasswordForm({ old_password: '', new_password: '' })
      logout()
      navigate('/login', { state: { message: 'Password changed. Please sign in again.' } })
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />

  const backTo = user ? defaultHomeForUser(user) : '/'

  return (
    <div className="mx-auto min-h-screen max-w-3xl bg-background p-4 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Profile & account</h1>
          <p className="text-sm text-muted-foreground">{profile?.email ?? user?.email}</p>
        </div>
        <Button variant="outline" onClick={() => navigate(backTo)}>
          Back to dashboard
        </Button>
      </div>

      {message && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile details</CardTitle>
            <CardDescription>
              {profile?.company} · {profile?.department || 'No department'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profile?.profile_picture && (
              <img
                src={profile.profile_picture}
                alt="Profile"
                className="mb-4 h-20 w-20 rounded-full object-cover"
              />
            )}
            <form onSubmit={handleProfileSave} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>First name</Label>
                  <Input
                    value={profileForm.first_name}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, first_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last name</Label>
                  <Input
                    value={profileForm.last_name}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, last_name: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={profileForm.phone_number}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phone_number: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Profile picture</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPictureFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save profile'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change password</CardTitle>
            <CardDescription>You will be signed out after changing your password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div className="space-y-2">
                <Label>Current password</Label>
                <Input
                  type="password"
                  value={passwordForm.old_password}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, old_password: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>New password</Label>
                <Input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, new_password: e.target.value })
                  }
                  required
                />
              </div>
              <Button type="submit" variant="secondary" disabled={saving}>
                {saving ? 'Updating...' : 'Change password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
