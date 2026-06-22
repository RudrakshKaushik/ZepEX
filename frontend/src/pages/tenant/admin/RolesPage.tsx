import { Pencil, Plus, PowerOff, UserCog } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  createCompanyRole,
  deactivateCompanyRole,
  listCompanyRoles,
  updateCompanyRole,
} from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog'
import { AdminDataTable, AdminTableCell, AdminTableRow } from '@/components/admin/AdminDataTable'
import { AdminListPanel } from '@/components/admin/AdminListPanel'
import { AdminModalFooter } from '@/components/admin/AdminModalFooter'
import { StatusBadge } from '@/components/StatusBadge'
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
import { PaginationControls } from '@/components/ui/pagination-controls'
import { toast } from '@/lib/toast'
import type { CompanyRole } from '@/types'

const defaultPermissions = {
  can_upload_receipt: false,
  can_submit_expense: false,
  can_approve_expense: false,
  can_mark_paid: false,
}

function PermissionCheck({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

const defaultRoleTemplates = [
  {
    name: 'Employee',
    can_upload_receipt: true,
    can_submit_expense: true,
    can_approve_expense: false,
    can_mark_paid: false,
  },
  {
    name: 'Manager',
    can_upload_receipt: false,
    can_submit_expense: false,
    can_approve_expense: true,
    can_mark_paid: false,
  },
  {
    name: 'Accounts',
    can_upload_receipt: false,
    can_submit_expense: false,
    can_approve_expense: false,
    can_mark_paid: true,
  },
] as const

export function RolesPage() {
  const { navItems } = useAdminNav()
  const [roles, setRoles] = useState<CompanyRole[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deactivateRole, setDeactivateRole] = useState<CompanyRole | null>(null)
  const [editing, setEditing] = useState<CompanyRole | null>(null)
  const [form, setForm] = useState({ name: '', ...defaultPermissions })
  const [editForm, setEditForm] = useState({ name: '', ...defaultPermissions })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await listCompanyRoles({ page })
      setRoles(data.results)
      setTotalPages(data.total_pages)
      setTotalCount(data.count)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await createCompanyRole(form)
      setForm({ name: '', ...defaultPermissions })
      setCreateOpen(false)
      toast.success('Role created successfully.')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (role: CompanyRole) => {
    setEditing(role)
    setEditForm({
      name: role.name,
      can_upload_receipt: role.can_upload_receipt,
      can_submit_expense: role.can_submit_expense,
      can_approve_expense: role.can_approve_expense,
      can_mark_paid: role.can_mark_paid,
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
      await updateCompanyRole(editing.id, editForm)
      setEditOpen(false)
      setEditing(null)
      toast.success('Role updated successfully.')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async () => {
    if (!deactivateRole) return
    setSaving(true)
    setError('')
    try {
      await deactivateCompanyRole(deactivateRole.id)
      setDeactivateRole(null)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleCreateDefaults = async () => {
    setSaving(true)
    setError('')
    try {
      for (const template of defaultRoleTemplates) {
        await createCompanyRole(template)
      }
      toast.success('Default roles created successfully.')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const permissionSummary = (role: CompanyRole) => {
    const parts: string[] = []
    if (role.can_upload_receipt) parts.push('Upload')
    if (role.can_submit_expense) parts.push('Submit')
    if (role.can_approve_expense) parts.push('Approve')
    if (role.can_mark_paid) parts.push('Pay')
    return parts.join(', ') || '—'
  }

  if (loading) return <PageLoader />

  return (
    <DashboardLayout
      title="Roles"
      subtitle="Manage company permission profiles"
      breadcrumb="Roles"
      icon={UserCog}
      navItems={navItems}
      headerAction={
        <div className="flex flex-wrap gap-2">
          {roles.length === 0 && (
            <Button variant="outline" disabled={saving} onClick={handleCreateDefaults}>
              Create default roles
            </Button>
          )}
          <Button onClick={() => { setError(''); setCreateOpen(true) }}>
            <Plus className="h-4 w-4" />
            Create Role
          </Button>
        </div>
      }
    >
      {error && !createOpen && !editOpen && !deactivateRole && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <AdminListPanel
        title="Company Roles"
        count={totalCount}
        description="Custom permission profiles for upload, approve, and payment workflows."
      >
        {roles.length === 0 ? (
          <p className="px-5 py-8 text-sm text-gray-400 sm:px-6">
            No roles yet. Create default roles or add your own.
          </p>
        ) : (
          <AdminDataTable columns={['Role', 'Permissions', 'Status', '']}>
            {roles.map((role) => (
              <AdminTableRow key={role.id}>
                <AdminTableCell className="font-medium text-gray-900">{role.name}</AdminTableCell>
                <AdminTableCell className="text-gray-500">{permissionSummary(role)}</AdminTableCell>
                <AdminTableCell>
                  <StatusBadge status={role.is_active ? 'ACTIVE' : 'INACTIVE'} />
                </AdminTableCell>
                <AdminTableCell>
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" disabled={saving} onClick={() => openEdit(role)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {role.is_active && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={saving}
                        onClick={() => setDeactivateRole(role)}
                      >
                        <PowerOff className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminDataTable>
        )}
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setPage}
          disabled={saving}
        />
      </AdminListPanel>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Role</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-2">
              <Label>Role name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Finance Head"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-2 rounded-md border border-gray-200 p-3">
                <PermissionCheck
                  label="Upload receipt"
                  checked={form.can_upload_receipt}
                  onChange={(v) => setForm({ ...form, can_upload_receipt: v })}
                />
                <PermissionCheck
                  label="Submit expense"
                  checked={form.can_submit_expense}
                  onChange={(v) => setForm({ ...form, can_submit_expense: v })}
                />
                <PermissionCheck
                  label="Approve expense"
                  checked={form.can_approve_expense}
                  onChange={(v) => setForm({ ...form, can_approve_expense: v })}
                />
                <PermissionCheck
                  label="Mark paid"
                  checked={form.can_mark_paid}
                  onChange={(v) => setForm({ ...form, can_mark_paid: v })}
                />
              </div>
            </div>
            {error && createOpen && <p className="text-sm text-red-600">{error}</p>}
            <AdminModalFooter
              onCancel={() => setCreateOpen(false)}
              submitLabel="Create"
              submitting={saving}
            />
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-3">
            <div className="space-y-2">
              <Label>Role name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-2 rounded-md border border-gray-200 p-3">
                <PermissionCheck
                  label="Upload receipt"
                  checked={editForm.can_upload_receipt}
                  onChange={(v) => setEditForm({ ...editForm, can_upload_receipt: v })}
                />
                <PermissionCheck
                  label="Submit expense"
                  checked={editForm.can_submit_expense}
                  onChange={(v) => setEditForm({ ...editForm, can_submit_expense: v })}
                />
                <PermissionCheck
                  label="Approve expense"
                  checked={editForm.can_approve_expense}
                  onChange={(v) => setEditForm({ ...editForm, can_approve_expense: v })}
                />
                <PermissionCheck
                  label="Mark paid"
                  checked={editForm.can_mark_paid}
                  onChange={(v) => setEditForm({ ...editForm, can_mark_paid: v })}
                />
              </div>
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
        open={!!deactivateRole}
        onOpenChange={(v) => !v && setDeactivateRole(null)}
        title="Deactivate Role"
        description={`Deactivate role "${deactivateRole?.name}"?`}
        confirmLabel="Deactivate"
        onConfirm={handleDeactivate}
        loading={saving}
      />
    </DashboardLayout>
  )
}
