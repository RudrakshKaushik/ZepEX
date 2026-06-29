import { Building2, GitBranch, ListFilter } from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPlatformCompanyDetails } from '@/api'
import { getApiErrorMessage } from '@/api/client'
import { AdminDataTable, AdminTableCell, AdminTableRow } from '@/components/admin/AdminDataTable'
import { AdminListPanel } from '@/components/admin/AdminListPanel'
import { AdminListSearchBar } from '@/components/admin/AdminListSearchBar'
import { StatusBadge } from '@/components/StatusBadge'
import { DashboardLayout, platformNavWithAudit } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/button'
import { TabbedTablePageShimmer } from '@/components/ui/shimmer'
import { PaginationControls } from '@/components/ui/pagination-controls'
import { formatDate } from '@/lib/utils'
import type {
  ApprovalWorkflow,
  CompanyRole,
  DepartmentRecord,
  EmployeeRecord,
  PlatformCompanyDetailsResponse,
  PolicyRule,
} from '@/types'

type Section = 'departments' | 'employees' | 'roles' | 'policy_rules' | 'workflow'

const SECTION_TABS: { label: string; value: Section }[] = [
  { label: 'Departments', value: 'departments' },
  { label: 'Employees', value: 'employees' },
  { label: 'Roles', value: 'roles' },
  { label: 'Policy', value: 'policy_rules' },
  { label: 'Workflow', value: 'workflow' },
]

const ROLE_OPTIONS = ['EMPLOYEE', 'MANAGER', 'ACCOUNTS', 'COMPANY_ADMIN'] as const

const selectClassName =
  'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm'

export function CompanyDetailPage() {
  const { companyId = '' } = useParams()
  const [section, setSection] = useState<Section>('departments')
  const [page, setPage] = useState(1)
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterDepartmentId, setFilterDepartmentId] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterCompanyRoleId, setFilterCompanyRoleId] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [data, setData] = useState<PlatformCompanyDetailsResponse | null>(null)
  const [filterOptions, setFilterOptions] = useState<{
    departments: DepartmentRecord[]
    roles: CompanyRole[]
  }>({ departments: [], roles: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!companyId) return
    Promise.all([
      getPlatformCompanyDetails(companyId, { section: 'departments', page_size: 100 }),
      getPlatformCompanyDetails(companyId, { section: 'roles', page_size: 100 }),
    ])
      .then(([deptRes, rolesRes]) => {
        setFilterOptions({
          departments: deptRes.data.departments?.results ?? [],
          roles: rolesRes.data.roles?.results ?? [],
        })
      })
      .catch(() => setFilterOptions({ departments: [], roles: [] }))
  }, [companyId])

  const load = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    setError('')
    try {
      const { data: response } = await getPlatformCompanyDetails(companyId, {
        section,
        page,
        page_size: 10,
        search: search || undefined,
        department_id: section === 'employees' && filterDepartmentId ? filterDepartmentId : undefined,
        role: section === 'employees' && filterRole ? filterRole : undefined,
        company_role_id:
          section === 'employees' && filterCompanyRoleId ? filterCompanyRoleId : undefined,
        category: section === 'policy_rules' && filterCategory ? filterCategory : undefined,
      })
      setData(response)
    } catch (err) {
      setError(getApiErrorMessage(err))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [
    companyId,
    section,
    page,
    search,
    filterDepartmentId,
    filterRole,
    filterCompanyRoleId,
    filterCategory,
  ])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [section, search, filterDepartmentId, filterRole, filterCompanyRoleId, filterCategory])

  useEffect(() => {
    setFiltersOpen(false)
    setFilterDepartmentId('')
    setFilterRole('')
    setFilterCompanyRoleId('')
    setFilterCategory('')
    setSearchDraft('')
    setSearch('')
  }, [section])

  const company = data?.company
  const showSearch = section !== 'workflow'
  const showFilters = section === 'employees' || section === 'policy_rules'

  if (loading && !data) {
    return (
      <DashboardLayout
        portal="platform"
        title="Company"
        breadcrumb="Company"
        icon={Building2}
        navItems={platformNavWithAudit}
      >
        <TabbedTablePageShimmer />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      portal="platform"
      title={company?.name ?? 'Company'}
      subtitle={company?.domain}
      breadcrumb="Company details"
      icon={Building2}
      navItems={platformNavWithAudit}
      headerAction={
        <Button asChild variant="outline">
          <Link to="/platform/companies">Back to companies</Link>
        </Button>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {company && (
        <div className="mb-4 flex flex-wrap gap-2 text-sm text-gray-600">
          <StatusBadge status={company.is_verified ? 'APPROVED' : 'PENDING'} />
          {company.is_active === false && <StatusBadge status="INACTIVE" />}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {SECTION_TABS.map((tab) => (
          <Button
            key={tab.value}
            type="button"
            size="sm"
            variant={section === tab.value ? 'default' : 'outline'}
            onClick={() => setSection(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {showSearch && (
        <AdminListPanel title={`Search ${section.replace('_', ' ')}`}>
          <div className="px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1">
                <AdminListSearchBar
                  value={searchDraft}
                  onChange={setSearchDraft}
                  onApply={() => setSearch(searchDraft.trim())}
                  onClear={() => {
                    setSearchDraft('')
                    setSearch('')
                  }}
                  placeholder={`Search ${section.replace('_', ' ')}…`}
                />
              </div>
              {showFilters && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFiltersOpen((value) => !value)}
                  aria-expanded={filtersOpen}
                >
                  <ListFilter className="h-4 w-4" />
                  Filter
                </Button>
              )}
            </div>
            {filtersOpen && section === 'employees' && (
              <div className="mt-3 flex flex-wrap gap-2 rounded-lg border border-[#e2e8f0] bg-gray-50 p-3">
                <select
                  className={selectClassName + ' min-w-[10rem] sm:flex-1'}
                  value={filterDepartmentId}
                  onChange={(e) => setFilterDepartmentId(e.target.value)}
                >
                  <option value="">All departments</option>
                  {filterOptions.departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <select
                  className={selectClassName + ' min-w-[8rem] sm:flex-1'}
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="">All system roles</option>
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0) + role.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
                <select
                  className={selectClassName + ' min-w-[8rem] sm:flex-1'}
                  value={filterCompanyRoleId}
                  onChange={(e) => setFilterCompanyRoleId(e.target.value)}
                >
                  <option value="">All company roles</option>
                  {filterOptions.roles.map((role) => (
                    <option key={role.id} value={String(role.id)}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {filtersOpen && section === 'policy_rules' && (
              <div className="mt-3 rounded-lg border border-[#e2e8f0] bg-gray-50 p-3">
                <input
                  className={selectClassName}
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  placeholder="Category e.g. food, hotel, fuel"
                />
              </div>
            )}
          </div>
        </AdminListPanel>
      )}

      <div className={showSearch ? 'mt-4' : undefined}>
        {section === 'departments' && (
          <SectionTable
            title="Departments"
            count={data?.departments?.count}
            columns={['Name', 'Manager', 'Created']}
            page={page}
            totalPages={data?.departments?.total_pages ?? 1}
            onPageChange={setPage}
            loading={loading}
          >
            {(data?.departments?.results ?? []).map((dept: DepartmentRecord) => (
              <AdminTableRow key={dept.id}>
                <AdminTableCell className="font-medium">{dept.name}</AdminTableCell>
                <AdminTableCell>{dept.manager_name ?? '—'}</AdminTableCell>
                <AdminTableCell className="text-gray-500">
                  {formatDate(dept.created_at)}
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </SectionTable>
        )}

        {section === 'employees' && (
          <SectionTable
            title="Employees"
            count={data?.employees?.count}
            columns={['Name', 'Email', 'Role', 'Department']}
            page={page}
            totalPages={data?.employees?.total_pages ?? 1}
            onPageChange={setPage}
            loading={loading}
          >
            {(data?.employees?.results ?? []).map((emp: EmployeeRecord) => (
              <AdminTableRow key={emp.id}>
                <AdminTableCell className="font-medium">
                  {emp.first_name} {emp.last_name}
                </AdminTableCell>
                <AdminTableCell>{emp.email}</AdminTableCell>
                <AdminTableCell>{emp.role}</AdminTableCell>
                <AdminTableCell>{emp.department_name || '—'}</AdminTableCell>
              </AdminTableRow>
            ))}
          </SectionTable>
        )}

        {section === 'roles' && (
          <SectionTable
            title="Roles"
            count={data?.roles?.count}
            columns={['Role', 'Permissions', 'Status']}
            page={page}
            totalPages={data?.roles?.total_pages ?? 1}
            onPageChange={setPage}
            loading={loading}
          >
            {(data?.roles?.results ?? []).map((role: CompanyRole) => (
              <AdminTableRow key={role.id}>
                <AdminTableCell className="font-medium">{role.name}</AdminTableCell>
                <AdminTableCell className="text-gray-500">
                  {[
                    role.can_upload_receipt && 'Upload',
                    role.can_submit_expense && 'Submit',
                    role.can_approve_expense && 'Approve',
                    role.can_mark_paid && 'Pay',
                  ]
                    .filter(Boolean)
                    .join(', ') || '—'}
                </AdminTableCell>
                <AdminTableCell>
                  <StatusBadge status={role.is_active ? 'APPROVED' : 'REJECTED'} />
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </SectionTable>
        )}

        {section === 'policy_rules' && (
          <SectionTable
            title="Policy rules"
            count={data?.policy_rules?.count}
            columns={['Category', 'Max amount', 'Description']}
            page={page}
            totalPages={data?.policy_rules?.total_pages ?? 1}
            onPageChange={setPage}
            loading={loading}
          >
            {(data?.policy_rules?.results ?? []).map((rule: PolicyRule) => (
              <AdminTableRow key={rule.id}>
                <AdminTableCell className="font-medium capitalize">
                  {rule.category_name.replace(/_/g, ' ')}
                </AdminTableCell>
                <AdminTableCell>{rule.max_amount}</AdminTableCell>
                <AdminTableCell className="text-gray-500">
                  {rule.category_description || '—'}
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </SectionTable>
        )}

        {section === 'workflow' && (
          <AdminListPanel
            title="Approval workflow"
            description="Read-only view of the company's active approval flow."
          >
            <div className="p-5 sm:p-6">
              <WorkflowSummary workflow={data?.workflow ?? null} />
            </div>
          </AdminListPanel>
        )}
      </div>
    </DashboardLayout>
  )
}

function SectionTable({
  title,
  count,
  columns,
  page,
  totalPages,
  onPageChange,
  loading,
  children,
}: {
  title: string
  count?: number
  columns: string[]
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  loading?: boolean
  children: ReactNode
}) {
  return (
    <AdminListPanel title={title} count={count}>
      {loading ? (
        <p className="px-5 py-8 text-sm text-gray-400">Loading…</p>
      ) : (
        <>
          <div className="p-4 sm:p-6">
            <AdminDataTable columns={columns}>{children}</AdminDataTable>
          </div>
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            totalCount={count ?? 0}
            onPageChange={onPageChange}
          />
        </>
      )}
    </AdminListPanel>
  )
}

function WorkflowSummary({ workflow }: { workflow: ApprovalWorkflow | null }) {
  if (!workflow) {
    return <p className="text-sm text-gray-500">No active workflow configured for this company.</p>
  }

  const steps = (workflow.steps ?? []).filter((s) => s.is_active).sort((a, b) => a.step_order - b.step_order)

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-gray-900">{workflow.name}</p>
      <ol className="space-y-3">
        {steps.map((step) => (
          <li
            key={step.id}
            className="flex items-start gap-3 rounded-lg border border-[#e2e8f0] bg-white px-4 py-3 text-sm"
          >
            <GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="font-medium text-gray-900">
                Step {step.step_order}: {step.approver_role_name}
              </p>
              <p className="text-gray-500">
                {step.routing_type === 'COMPANY'
                  ? 'Company wide'
                  : step.department_name
                    ? `Pinned to ${step.department_name}`
                    : "Submitter's department"}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
