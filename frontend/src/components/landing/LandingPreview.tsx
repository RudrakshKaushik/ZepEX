import {
  CheckCircle2,
  Clock,
  FileText,
  LayoutDashboard,
  LogOut,
  Upload,
  User,
  Wallet,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { SectionIntro } from '@/components/landing/landing-ui'
import { cn } from '@/lib/utils'

type PreviewTab = 'admin' | 'employee'

const sectionDescription =
  'Preview your complete workspace, manage expenses, track approvals, and access everything in one organized place.'

function PreviewMetric({
  label,
  value,
  accent,
  icon: Icon,
}: {
  label: string
  value: string
  accent: 'purple' | 'blue' | 'green' | 'red'
  icon: LucideIcon
}) {
  const colors = {
    purple: 'bg-violet-500',
    blue: 'bg-[#0066FF]',
    green: 'bg-green-500',
    red: 'bg-red-500',
  }
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className={cn('mb-3 flex h-9 w-9 items-center justify-center rounded-full', colors[accent])}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
    </div>
  )
}

function ManagerPreview() {
  const rows = Array.from({ length: 3 }, (_, i) => i)

  return (
    <div className="flex min-h-[420px] flex-col md:flex-row">
      <aside className="flex w-full shrink-0 flex-row gap-1 border-b border-gray-100 bg-white p-2 md:w-48 md:flex-col md:border-b-0 md:border-r md:p-4">
        <div className="mb-2 hidden items-center gap-2 md:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0066FF] text-white">
            <span className="text-xs font-bold">Z</span>
          </div>
          <span className="font-bold text-gray-900">ZepEX</span>
        </div>
        <div className="flex flex-1 gap-1 md:flex-col">
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-[#0066FF]">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden md:inline">Dashboard</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500">
            <Wallet className="h-4 w-4" />
            <span className="hidden md:inline">My Expenses</span>
          </div>
        </div>
        <button
          type="button"
          className="mt-auto hidden items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 md:flex"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </aside>

      <div className="flex-1 bg-[#f8fafc] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0066FF] text-white">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Manager Dashboard</h3>
            <p className="text-sm text-gray-500">
              Engineering <span className="text-gray-300">•</span> bitloom.ai
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <PreviewMetric label="Team Reports" value="24" accent="purple" icon={FileText} />
          <PreviewMetric label="Pending" value="365" accent="blue" icon={Clock} />
          <PreviewMetric label="Paid" value="47" accent="green" icon={CheckCircle2} />
          <PreviewMetric label="Rejected" value="68" accent="red" icon={XCircle} />
        </div>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">Current Month Report</p>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                Draft
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Engineering <span className="text-gray-300">•</span> 1 Jan 2026
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-[#0066FF] px-4 py-2 text-xs font-semibold text-white"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload Receipts & Submit Report
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="hidden grid-cols-4 gap-2 border-b border-gray-100 bg-[#edf2f7] px-4 py-2 text-xs font-semibold text-gray-600 sm:grid">
            <span>Submitted</span>
            <span>Manager Action</span>
            <span>Accounts Action</span>
            <span>Paid At</span>
          </div>
          {rows.map((i) => (
            <div
              key={i}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-50 px-4 py-3 last:border-0 sm:grid sm:grid-cols-4"
            >
              <div className="flex items-center gap-2 sm:col-span-1">
                <FileText className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Unknown Sender</p>
                  <p className="text-xs text-gray-500">No line items extracted yet.</p>
                </div>
              </div>
              <div className="sm:col-span-2">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  Draft
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 sm:text-right">$450</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EmployeePreview() {
  return (
    <div className="flex min-h-[420px] flex-col md:flex-row">
      <aside className="flex w-full shrink-0 flex-row gap-1 border-b border-gray-100 bg-white p-2 md:w-48 md:flex-col md:border-b-0 md:border-r md:p-4">
        <div className="mb-2 hidden items-center gap-2 md:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0066FF] text-white">
            <span className="text-xs font-bold">Z</span>
          </div>
          <span className="font-bold text-gray-900">ZepEX</span>
        </div>
        <div className="flex flex-1 gap-1 md:flex-col">
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-[#0066FF]">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden md:inline">Dashboard</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500">
            <Wallet className="h-4 w-4" />
            <span className="hidden md:inline">My Expenses</span>
          </div>
        </div>
        <button
          type="button"
          className="mt-auto hidden items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 md:flex"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </aside>

      <div className="flex-1 bg-[#f8fafc] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0066FF] text-white">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Employee Dashboard</h3>
            <p className="text-sm text-gray-500">
              Engineering <span className="text-gray-300">•</span> bitloom.ai
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <PreviewMetric label="My Reports" value="6" accent="purple" icon={FileText} />
          <PreviewMetric label="Draft" value="2" accent="blue" icon={Clock} />
          <PreviewMetric label="Submitted" value="3" accent="green" icon={CheckCircle2} />
          <PreviewMetric label="Paid" value="1" accent="green" icon={CheckCircle2} />
        </div>

        <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">Current Month Report</p>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                In Progress
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Engineering <span className="text-gray-300">•</span> 1 Jan 2026
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-[#0066FF] px-4 py-2 text-xs font-semibold text-white"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload Receipts & Submit Report
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
          {['Uber ride', 'Team lunch', 'Software license'].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between border-b border-gray-50 px-4 py-3 last:border-0"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{item}</p>
                  <p className="text-xs text-gray-500">Receipt uploaded</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-900">$450</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function LandingPreview() {
  const [tab, setTab] = useState<PreviewTab>('admin')

  return (
    <section id="preview" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionIntro
          badge="View The Dashboards"
          badgeEndIcon="⊞"
          title="Preview The Workspace"
          description={sectionDescription}
        />

        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1">
            {(['admin', 'employee'] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  'rounded-md px-6 py-2 text-sm font-medium capitalize transition',
                  tab === id
                    ? 'bg-[#0066FF] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900',
                )}
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          {tab === 'admin' ? <ManagerPreview /> : <EmployeePreview />}
        </div>
      </div>
    </section>
  )
}
