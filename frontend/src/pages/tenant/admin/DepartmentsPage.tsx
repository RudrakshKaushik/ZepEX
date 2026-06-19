import { Building2, Pencil, Plus, Power, PowerOff, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  activateDepartment,
  createDepartment,
  deactivateDepartment,
  deleteDepartment,
  listDepartments,
  listEmployees,
  updateDepartment,
} from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog'
import { AdminDataTable, AdminTableCell, AdminTableRow } from '@/components/admin/AdminDataTable'
import { AdminListPanel } from '@/components/admin/AdminListPanel'
import { AdminModalFooter } from '@/components/admin/AdminModalFooter'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAdminNav } from '@/hooks/useAdminNav'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageLoader } from '@/components/ui/spinner'
import type { DepartmentRecord, EmployeeRecord } from '@/types'
import { formatDate } from '@/lib/utils'

const selectClassName =
  'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm'

type ConfirmAction = { type: 'deactivate' | 'delete'; dept: DepartmentRecord }

export function DepartmentsPage() {
  const { navItems } = useAdminNav()
  const [departments, setDepartments] = useState<DepartmentRecord[]>([])
  const [managers, setManagers] = useState<EmployeeRecord[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<DepartmentRecord | null>(null)
  const [editForm, setEditForm] = useState({ name: '', manager_id: '' })
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [deptRes, empRes] = await Promise.all([listDepartments(), listEmployees()])
      setDepartments(deptRes.data)
      setManagers(empRes.data.filter((e) => e.role === 'MANAGER' && e.is_active !== false))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async (e: FormEvent) => {
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

  const openEdit = (dept: DepartmentRecord) => {
    setEditing(dept)
    setEditForm({
      name: dept.name,
      manager_id: dept.manager ? String(dept.manager) : '',
    })
    setError('')
    setEditOpen(true)
  }

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setSaving(true)
    setError('')
    try {
      await updateDepartment(editing.id, {
        name: editForm.name,
        manager_id: editForm.manager_id ? parseInt(editForm.manager_id, 10) : null,
      })
      setEditOpen(false)
      setEditing(null)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmAction = async () => {
    if (!confirm) return
    setSaving(true)
    setError('')
    try {
      if (confirm.type === 'deactivate') {
        await deactivateDepartment(confirm.dept.id)
      } else {
        await deleteDepartment(confirm.dept.id)
      }
      setConfirm(null)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleActivate = async (dept: DepartmentRecord) => {
    setSaving(true)
    setError('')
    try {
      await activateDepartment(dept.id)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const managerName = (managerId: string | null) => {
    if (!managerId) return '—'
    const m = managers.find((mgr) => String(mgr.id) === managerId)
    return m ? `${m.first_name} ${m.last_name}` : managerId
  }

  if (loading) return <PageLoader />

  return (
    <DashboardLayout
      title="Departments"
      subtitle="Organize your company structure"
      breadcrumb="Departments"
      icon={Building2}
      navItems={navItems}
      headerAction={
        <Button onClick={() => { setError(''); setOpen(true) }}>
          <Plus className="h-4 w-4" />
          Create Department
        </Button>
      }
    >
      {error && !open && !editOpen && !confirm && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <AdminListPanel
        title="All Departments"
        count={departments.length}
        description="View and manage departments across your organization."
      >
        {departments.length === 0 ? (
          <p className="px-5 py-8 text-sm text-gray-400 sm:px-6">No departments yet.</p>
        ) : (
          <AdminDataTable columns={['Name', 'Manager', 'Created', '']}>
            {departments.map((dept) => (
              <AdminTableRow key={dept.id}>
                <AdminTableCell className="font-medium text-gray-900">{dept.name}</AdminTableCell>
                <AdminTableCell>{managerName(dept.manager)}</AdminTableCell>
                <AdminTableCell className="text-gray-500">
                  {formatDate(dept.created_at)}
                </AdminTableCell>
                <AdminTableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" disabled={saving} onClick={() => openEdit(dept)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {dept.is_active === false ? (
                      <Button size="sm" variant="ghost" disabled={saving} onClick={() => handleActivate(dept)}>
                        <Power className="h-3.5 w-3.5 text-green-600" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={saving}
                        onClick={() => setConfirm({ type: 'deactivate', dept })}
                      >
                        <PowerOff className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={saving}
                      onClick={() => setConfirm({ type: 'delete', dept })}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminDataTable>
        )}
      </AdminListPanel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Department</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
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
            {error && open && <p className="text-sm text-red-600">{error}</p>}
            <AdminModalFooter
              onCancel={() => setOpen(false)}
              submitLabel="Create"
              submitting={saving}
            />
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Department name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Manager</Label>
              <select
                className={selectClassName}
                value={editForm.manager_id}
                onChange={(e) => setEditForm({ ...editForm, manager_id: e.target.value })}
              >
                <option value="">No manager</option>
                {managers.map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    {m.first_name} {m.last_name} ({m.email})
                  </option>
                ))}
              </select>
            </div>
            {error && editOpen && <p className="text-sm text-red-600">{error}</p>}
            <AdminModalFooter
              onCancel={() => setEditOpen(false)}
              submitLabel="Save"
              submitting={saving}
            />
          </form>
        </DialogContent>
      </Dialog>

      <AdminConfirmDialog
        open={confirm?.type === 'deactivate'}
        onOpenChange={(v) => !v && setConfirm(null)}
        title="Deactivate Department"
        description={`Are you sure you want to deactivate "${confirm?.dept.name}"?`}
        confirmLabel="Deactivate"
        onConfirm={handleConfirmAction}
        loading={saving}
      />

      <AdminConfirmDialog
        open={confirm?.type === 'delete'}
        onOpenChange={(v) => !v && setConfirm(null)}
        title="Delete Department"
        description={`Permanently delete "${confirm?.dept.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmAction}
        loading={saving}
      />
    </DashboardLayout>
  )
}
