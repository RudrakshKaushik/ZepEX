import { Plus, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  assignManager,
  createEmployee,
  listDepartments,
  listEmployees,
} from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { StatusBadge } from '@/components/StatusBadge'
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
import type { DepartmentRecord, EmployeeRecord } from '@/types'
import { formatDate } from '@/lib/utils'

const roles = ['MANAGER', 'EMPLOYEE', 'ACCOUNTS'] as const

const selectClassName =
  'flex h-10 w-full rounded-lg border border-input bg-card px-3 text-sm'

export function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [departments, setDepartments] = useState<DepartmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignDept, setAssignDept] = useState('')
  const [assignManagerId, setAssignManagerId] = useState('')
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE' as string,
    department_id: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [empRes, deptRes] = await Promise.all([listEmployees(), listDepartments()])
      setEmployees(empRes.data)
      setDepartments(deptRes.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const resetForm = () => {
    setForm({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role: 'EMPLOYEE',
      department_id: '',
    })
  }

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        department_id: form.role === 'ACCOUNTS' ? undefined : form.department_id || undefined,
      }
      await createEmployee(payload)
      resetForm()
      setCreateOpen(false)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleAssign = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await assignManager(assignDept, assignManagerId)
      setAssignDept('')
      setAssignManagerId('')
      setAssignOpen(false)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const managers = employees.filter((e) => e.role === 'MANAGER')

  if (loading) return <PageLoader />

  return (
    <DashboardLayout title="Employees" subtitle="Manage users and assign managers" navItems={adminNav}>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle>All users ({employees.length})</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => { setError(''); setAssignOpen(true) }}>
              <UserPlus className="h-4 w-4" />
              Assign manager
            </Button>
            <Button onClick={() => { setError(''); setCreateOpen(true) }}>
              <Plus className="h-4 w-4" />
              Create employee
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Department</th>
                  <th className="pb-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="border-t">
                    <td className="py-3 font-medium">
                      {emp.first_name} {emp.last_name}
                    </td>
                    <td className="py-3">{emp.email}</td>
                    <td className="py-3">
                      <StatusBadge status={emp.role} />
                    </td>
                    <td className="py-3">{emp.department_name || '—'}</td>
                    <td className="py-3 text-muted-foreground">{formatDate(emp.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create employee</DialogTitle>
            <DialogDescription>Add a new user to your company.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>First name</Label>
                <Input
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Last name</Label>
                <Input
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                className={selectClassName}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            {form.role !== 'ACCOUNTS' && (
              <div className="space-y-2">
                <Label>Department</Label>
                <select
                  className={selectClassName}
                  value={form.department_id}
                  onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                  required
                >
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {error && createOpen && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Creating...' : 'Create user'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign manager to department</DialogTitle>
            <DialogDescription>Link a manager to oversee a department.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssign} className="space-y-3">
            <div className="space-y-2">
              <Label>Department</Label>
              <select
                className={selectClassName}
                value={assignDept}
                onChange={(e) => setAssignDept(e.target.value)}
                required
              >
                <option value="">Select department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Manager</Label>
              <select
                className={selectClassName}
                value={assignManagerId}
                onChange={(e) => setAssignManagerId(e.target.value)}
                required
              >
                <option value="">Select manager</option>
                {managers.map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    {m.first_name} {m.last_name} ({m.email})
                  </option>
                ))}
              </select>
            </div>
            {error && assignOpen && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAssignOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="secondary" disabled={saving}>
                {saving ? 'Assigning...' : 'Assign manager'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
