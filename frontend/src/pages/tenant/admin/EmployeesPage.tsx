import { Pencil, Power, PowerOff, Trash2, Users } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  activateCompanyUser,
  assignManager,
  assignMissingCompanyRoles,
  createEmployee,
  deactivateCompanyUser,
  deleteCompanyUser,
  editCompanyUser,
  listCompanyRoles,
  listDepartments,
  listEmployees,
} from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { toast } from '@/lib/toast'
import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog'
import { AdminDataTable, AdminTableCell, AdminTableRow, RolePill } from '@/components/admin/AdminDataTable'
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
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { AdminListPanelShimmer } from '@/components/ui/shimmer'
import { PaginationControls } from '@/components/ui/pagination-controls'
import type { CompanyRole, DepartmentRecord, EmployeeRecord } from '@/types'
import { fetchAllPages } from '@/lib/pagination'
import { formatDate } from '@/lib/utils'
import UploadIcon from '@/assets/upload.png'
import AssignIcon from '@/assets/assign.png'

const roles = ['MANAGER', 'EMPLOYEE', 'ACCOUNTS'] as const

const selectClassName =
  'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm'

type ConfirmAction = { type: 'deactivate' | 'delete'; emp: EmployeeRecord }

const systemRoleToCompanyRoleName: Record<string, string> = {
  EMPLOYEE: 'Employee',
  MANAGER: 'Manager',
  ACCOUNTS: 'Accounts',
}

function matchCompanyRoleId(systemRole: string, companyRoles: CompanyRole[]) {
  const name = systemRoleToCompanyRoleName[systemRole]
  if (!name) return ''
  const match = companyRoles.find((r) => r.name.toLowerCase() === name.toLowerCase())
  return match ? String(match.id) : ''
}

export function EmployeesPage() {
  const { navItems } = useAdminNav()
  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [allEmployees, setAllEmployees] = useState<EmployeeRecord[]>([])
  const [departments, setDepartments] = useState<DepartmentRecord[]>([])
  const [companyRoles, setCompanyRoles] = useState<CompanyRole[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null)
  const [editing, setEditing] = useState<EmployeeRecord | null>(null)
  const [assignDept, setAssignDept] = useState('')
  const [assignManagerId, setAssignManagerId] = useState('')
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE' as string,
    department_id: '',
    company_role_id: '',
  })
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    role: 'EMPLOYEE',
    department_id: '',
    company_role_id: '',
    phone_number: '',
    address: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [empRes, allDepts, allEmps, rolesRes] = await Promise.all([
        listEmployees({ page }),
        fetchAllPages((page) => listDepartments({ page })),
        fetchAllPages((page) => listEmployees({ page })),
        listCompanyRoles(),
      ])
      setEmployees(empRes.data.results)
      setTotalPages(empRes.data.total_pages)
      setTotalCount(empRes.data.count)
      setAllEmployees(allEmps)
      setDepartments(allDepts.filter((d) => d.is_active !== false))
      setCompanyRoles(rolesRes.data.results)
    } finally {
      setLoading(false)
    }
  }, [page])

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
      company_role_id: matchCompanyRoleId('EMPLOYEE', companyRoles),
    })
  }

  const handleFixMissingRoles = async () => {
    setSaving(true)
    setError('')
    try {
      const { data } = await assignMissingCompanyRoles()
      toast.success(data.message)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const setSystemRole = (role: string) => {
    setForm((prev) => ({
      ...prev,
      role,
      company_role_id: matchCompanyRoleId(role, companyRoles) || prev.company_role_id,
    }))
  }

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await createEmployee({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        role: form.role,
        department_id: form.role === 'ACCOUNTS' ? undefined : form.department_id || undefined,
        company_role_id: form.company_role_id ? parseInt(form.company_role_id, 10) : undefined,
      })
      resetForm()
      setCreateOpen(false)
      toast.success('Employee created successfully.')
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const openEdit = (emp: EmployeeRecord) => {
    setEditing(emp)
    setEditForm({
      first_name: emp.first_name,
      last_name: emp.last_name,
      role: emp.role,
      department_id: emp.department || '',
      company_role_id: emp.company_role ? String(emp.company_role) : '',
      phone_number: emp.phone_number || '',
      address: emp.address || '',
    })
    setError('')
    setEditOpen(true)
  }

  const handleEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setSaving(true)
    setError('')
    try {
      await editCompanyUser(editing.id, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        role: editForm.role,
        department_id: editForm.role === 'ACCOUNTS' ? null : editForm.department_id || null,
        company_role_id: editForm.company_role_id
          ? parseInt(editForm.company_role_id, 10)
          : null,
        phone_number: editForm.phone_number || undefined,
        address: editForm.address || undefined,
      })
      setEditOpen(false)
      setEditing(null)
      toast.success('Employee updated successfully.')
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
        await deactivateCompanyUser(confirm.emp.id)
      } else {
        await deleteCompanyUser(confirm.emp.id)
      }
      setConfirm(null)
      await load()
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleActivate = async (emp: EmployeeRecord) => {
    setSaving(true)
    setError('')
    try {
      await activateCompanyUser(emp.id)
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
      await assignManager(assignDept, parseInt(assignManagerId, 10))
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

  const managers = allEmployees.filter((e) => e.role === 'MANAGER' && e.is_active !== false)
  const missingCompanyRoleCount = allEmployees.filter(
    (e) => !e.company_role_name && ['EMPLOYEE', 'MANAGER', 'ACCOUNTS'].includes(e.role),
  ).length

  if (loading) {
    return (
      <DashboardLayout
        title="Employees"
        subtitle="Manage users and assign managers"
        breadcrumb="Employees"
        icon={Users}
        navItems={navItems}
      >
        <AdminListPanelShimmer />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Employees"
      subtitle="Manage users and assign managers"
      breadcrumb="Employees"
      icon={Users}
      navItems={navItems}
      headerAction={
        <>
          <Button variant="secondary" onClick={() => { setError(''); setAssignOpen(true) }}>
            Assign Manager
            <img src={AssignIcon} alt="Assign" className="w-6 h-6" />
          </Button>
          <Button onClick={() => { setError(''); resetForm(); setCreateOpen(true) }}>
            Create Employee
            <img src={UploadIcon} alt="Upload" className="w-6 h-6" />
          </Button>
        </>
      }
    >
      {missingCompanyRoleCount > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
          <p>
            {missingCompanyRoleCount} user(s) have no company role assigned.
          </p>
          <Button size="sm" variant="outline" disabled={saving} onClick={handleFixMissingRoles}>
            Assign default roles
          </Button>
        </div>
      )}
      {error && !createOpen && !editOpen && !assignOpen && !confirm && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <AdminListPanel
        title="All Users"
        count={totalCount}
        description="View employee details, roles, and department assignments."
      >
        <AdminDataTable columns={['Name', 'Email Address', 'Role', 'Department', 'Created', '']}>
          {employees.map((emp) => (
            <AdminTableRow key={emp.id}>
              <AdminTableCell className="font-medium text-gray-900">
                {emp.first_name} {emp.last_name}
              </AdminTableCell>
              <AdminTableCell>{emp.email}</AdminTableCell>
              <AdminTableCell>
                <RolePill>{emp.role.toLowerCase()}</RolePill>
              </AdminTableCell>
              <AdminTableCell>{emp.department_name || '—'}</AdminTableCell>
              <AdminTableCell className="text-gray-500">
                {formatDate(emp.created_at)}
              </AdminTableCell>
              <AdminTableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button size="sm" variant="ghost" disabled={saving} onClick={() => openEdit(emp)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {emp.is_active === false ? (
                    <Button size="sm" variant="ghost" disabled={saving} onClick={() => handleActivate(emp)}>
                      <Power className="h-3.5 w-3.5 text-green-600" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={saving}
                      onClick={() => setConfirm({ type: 'deactivate', emp })}
                    >
                      <PowerOff className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={saving}
                    onClick={() => setConfirm({ type: 'delete', emp })}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminDataTable>
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          onPageChange={setPage}
          disabled={saving}
        />
      </AdminListPanel>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Employee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="First name"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  required
                />
                <Input
                  placeholder="Last name"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
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
              <PasswordInput
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <select
                className={selectClassName}
                value={form.department_id}
                onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                required={form.role !== 'ACCOUNTS'}
                disabled={form.role === 'ACCOUNTS'}
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
              <Label>Role</Label>
              <select
                className={selectClassName}
                value={form.role}
                onChange={(e) => setSystemRole(e.target.value)}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                  required
                />
                <Input
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                className={selectClassName}
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Company role</Label>
              <select
                className={selectClassName}
                value={editForm.company_role_id}
                onChange={(e) => setEditForm({ ...editForm, company_role_id: e.target.value })}
              >
                <option value="">None</option>
                {companyRoles.map((r) => (
                  <option key={r.id} value={String(r.id)}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            {editForm.role !== 'ACCOUNTS' && (
              <div className="space-y-2">
                <Label>Department</Label>
                <select
                  className={selectClassName}
                  value={editForm.department_id}
                  onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })}
                >
                  <option value="">None</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {error && editOpen && <p className="text-sm text-red-600">{error}</p>}
            <AdminModalFooter
              onCancel={() => setEditOpen(false)}
              submitLabel="Save"
              submitting={saving}
            />
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Role To Department</DialogTitle>
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
                    {m.first_name} {m.last_name}
                  </option>
                ))}
              </select>
            </div>
            {error && assignOpen && <p className="text-sm text-red-600">{error}</p>}
            <AdminModalFooter
              onCancel={() => setAssignOpen(false)}
              submitLabel="Assign"
              submitting={saving}
            />
          </form>
        </DialogContent>
      </Dialog>

      <AdminConfirmDialog
        open={confirm?.type === 'deactivate'}
        onOpenChange={(v) => !v && setConfirm(null)}
        title="Deactivate Employee"
        description={`Deactivate ${confirm?.emp.email}? They will not be able to log in.`}
        confirmLabel="Deactivate"
        onConfirm={handleConfirmAction}
        loading={saving}
      />

      <AdminConfirmDialog
        open={confirm?.type === 'delete'}
        onOpenChange={(v) => !v && setConfirm(null)}
        title="Delete Employee"
        description={`Permanently delete ${confirm?.emp.email}? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleConfirmAction}
        loading={saving}
      />
    </DashboardLayout>
  )
}
