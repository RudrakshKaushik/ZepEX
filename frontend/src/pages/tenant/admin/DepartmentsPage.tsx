import { Plus } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { createDepartment, listDepartments } from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { DashboardLayout, adminNav } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageLoader } from '@/components/ui/spinner'
import type { DepartmentRecord } from '@/types'
import { formatDate } from '@/lib/utils'

export function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentRecord[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await listDepartments()
      setDepartments(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await createDepartment(name)
      setName('')
      setOpen(false)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <DashboardLayout title="Departments" subtitle="Organize your company structure" navItems={adminNav}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>All departments ({departments.length})</CardTitle>
          <Button onClick={() => { setError(''); setOpen(true) }}>
            <Plus className="h-4 w-4" />
            Add department
          </Button>
        </CardHeader>
        <CardContent>
          {departments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No departments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Manager</th>
                    <th className="pb-3 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept) => (
                    <tr key={dept.id} className="border-t">
                      <td className="py-3 font-medium">{dept.name}</td>
                      <td className="py-3">{dept.manager || '—'}</td>
                      <td className="py-3 text-muted-foreground">{formatDate(dept.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add department</DialogTitle>
            <DialogDescription>Create a new department for your company.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Department name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Engineering"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Creating...' : 'Create department'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
