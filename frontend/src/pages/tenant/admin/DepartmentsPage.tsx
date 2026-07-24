import { Building2, Pencil, Power, PowerOff, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  activateDepartment,
  createDepartment,
  deactivateDepartment,
  deleteDepartment,
  downloadDepartmentTemplate,
  importDepartments,
  listDepartments,
  listEmployees,
  updateDepartment,
} from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { AdminBulkActions } from '@/components/admin/AdminBulkActions'
import { CsvImportDialog } from '@/components/admin/CsvImportDialog'
import { AdminListSearchBar } from '@/components/admin/AdminListSearchBar'
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
import { AdminListPanelShimmer } from '@/components/ui/shimmer'
import { PaginationControls } from '@/components/ui/pagination-controls'
import type { DepartmentRecord, EmployeeRecord } from '@/types'
import { fetchAllPages } from '@/lib/pagination'
import { toast } from '@/lib/toast'
import { formatDate } from '@/lib/utils'
import UploadIcon from '@/assets/upload.png'

const selectClassName =
  'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm'

type ConfirmAction = { type: 'deactivate' | 'delete'; dept: DepartmentRecord }

export function DepartmentsPage() {
  const { navItems } = useAdminNav()
  const [departments, setDepartments] = useState<DepartmentRecord[]>([])
  const [allEmployees, setAllEmployees] = useState<EmployeeRecord[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<DepartmentRecord | null>(null)
  const [editForm, setEditForm] = useState({ name: '', manager_id: '' })
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null)
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [importOpen, setImportOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [deptRes, allEmployees] = await Promise.all([
        listDepartments({ page, search: search || undefined }),
        fetchAllPages((page) => listEmployees({ page })),
      ])
      setDepartments(deptRes.data.results)
      setTotalPages(deptRes.data.total_pages)
      setTotalCount(deptRes.data.count)
      setAllEmployees(allEmployees)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    setPage(1)
  }, [search])

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
      toast.success('Department created successfully.')
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
      toast.success('Department updated successfully.')
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

  const managers = allEmployees.filter((e) => e.role === 'MANAGER' && e.is_active !== false)

  const managerName = (dept: DepartmentRecord) => {
    if (dept.manager_name) return dept.manager_name
    if (!dept.manager) return '—'
    const m = allEmployees.find((emp) => String(emp.id) === String(dept.manager))
    return m ? `${m.first_name} ${m.last_name}`.trim() || m.email : '—'
  }

  if (loading) {
    return (
      <DashboardLayout
        title="Departments"
        subtitle="Organize teams and assign managers"
        breadcrumb="Departments"
        icon={Building2}
        navItems={navItems}
      >
        <AdminListPanelShimmer />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Departments"
      subtitle="Organize your company structure"
      breadcrumb="Departments"
      icon={Building2}
      navItems={navItems}
      headerAction={
        <div className="flex flex-wrap gap-2">
          <AdminBulkActions
            onImport={() => setImportOpen(true)}
            onDownloadTemplate={downloadDepartmentTemplate}
            disabled={saving}
          />
          <Button onClick={() => { setError(''); setOpen(true) }}>
            Create Department
            <img src={UploadIcon} alt="Upload" className="w-6 h-6" />
          </Button>
        </div>
      }
    >
      {error && !open && !editOpen && !confirm && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <AdminListPanel
        title="All Departments"
        count={totalCount}
        description="View and manage departments across your organization."
        toolbar={
          <AdminListSearchBar
            value={searchDraft}
            onChange={setSearchDraft}
            onApply={() => setSearch(searchDraft.trim())}
            onClear={() => {
              setSearchDraft('')
              setSearch('')
            }}
            placeholder="Search departments…"
            disabled={saving}
          />
        }
      >
        {departments.length === 0 ? (
          <p className="px-5 py-8 text-sm text-gray-400 sm:px-6">No departments yet.</p>
        ) : (
          <AdminDataTable columns={['Name', 'Manager', 'Created', '']}>
            {departments.map((dept) => (
              <AdminTableRow key={dept.id}>
                <AdminTableCell className="font-medium text-gray-900">{dept.name}</AdminTableCell>
                <AdminTableCell>{managerName(dept)}</AdminTableCell>
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
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setPage}
          disabled={saving}
        />
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

      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        title="Import departments"
        description="Upload a CSV file to create or update departments in bulk."
        onImport={importDepartments}
        onSuccess={load}
      />
    </DashboardLayout>
  )
}
