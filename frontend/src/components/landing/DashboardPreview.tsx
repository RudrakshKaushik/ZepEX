import {
  Building2,
  FileText,
  LayoutDashboard,
  Receipt,
  ScrollText,
  Settings,
  Shield,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type PreviewTab = 'employee' | 'admin'

const tabs: { id: PreviewTab; label: string }[] = [
  { id: 'employee', label: 'Employee' },
  { id: 'admin', label: 'Admin' },
]

function BrowserChrome({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2.5 sm:px-4">
      <div className="flex shrink-0 gap-1.5">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400 sm:h-3 sm:w-3" />
        <div className="h-2.5 w-2.5 rounded-full bg-amber-400 sm:h-3 sm:w-3" />
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 sm:h-3 sm:w-3" />
      </div>
      <div className="min-w-0 flex-1 truncate rounded-md border border-slate-200 bg-white px-2 py-1 text-center text-[10px] text-slate-500 sm:px-3 sm:text-xs">
        {title}
      </div>
    </div>
  )
}

function SidebarNav({
  items,
  active,
}: {
  items: { label: string; icon: typeof LayoutDashboard; active?: boolean }[]
  active: string
}) {
  return (
    <div className="border-b border-slate-200 bg-white p-3 sm:border-b-0 sm:border-r md:w-44 md:shrink-0 lg:w-48">
      <p className="mb-2 hidden text-[10px] font-semibold uppercase tracking-wider text-slate-400 md:block">
        Menu
      </p>
      <div className="flex gap-1 overflow-x-auto pb-1 sm:gap-2 md:flex-col md:overflow-visible md:pb-0">
        {items.map((item) => (
          <div
            key={item.label}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm',
              item.label === active
                ? 'bg-indigo-50 font-medium text-indigo-700'
                : 'text-slate-600',
            )}
          >
            <item.icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="whitespace-nowrap">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmployeePreview() {
  return (
    <div className="flex min-h-[280px] flex-col sm:min-h-[320px] md:flex-row">
      <SidebarNav
        active="Dashboard"
        items={[
          { label: 'Dashboard', icon: LayoutDashboard, active: true },
          { label: 'Expenses', icon: Receipt },
          { label: 'Reports', icon: FileText },
          { label: 'Settings', icon: Settings },
        ]}
      />
      <div className="min-w-0 flex-1 bg-slate-50/50 p-4 sm:p-5">
        <p className="text-sm font-semibold text-slate-900 sm:text-base">My Dashboard</p>
        <p className="text-xs text-slate-500 sm:text-sm">ZepEX.ai · Engineering</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {[
            { label: 'Total reports', value: '6' },
            { label: 'Pending', value: '1' },
            { label: 'Paid', value: '4' },
            { label: 'Rejected', value: '0' },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-lg border border-slate-200 bg-white p-2.5 sm:p-3"
            >
              <p className="text-[10px] text-slate-500 sm:text-xs">{m.label}</p>
              <p className="mt-0.5 text-base font-bold text-slate-900 sm:text-lg">{m.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg bg-indigo-600 px-3 py-2 text-center text-xs font-medium text-white sm:mt-4 sm:inline-block sm:px-4 sm:text-sm">
          Upload receipts & submit report
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-slate-700 sm:text-sm">Current month report</p>
          {[
            { vendor: 'Uber', amount: '₹340', status: 'AI Processed' },
            { vendor: 'AWS', amount: '₹4,200', status: 'Valid' },
          ].map((r) => (
            <div
              key={r.vendor}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Receipt className="h-3.5 w-3.5 shrink-0 text-indigo-600 sm:h-4 sm:w-4" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium sm:text-sm">{r.vendor}</p>
                  <p className="text-[10px] text-slate-500 sm:text-xs">{r.amount}</p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 sm:text-xs">
                {r.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AdminPreview() {
  return (
    <div className="flex min-h-[280px] flex-col sm:min-h-[320px] md:flex-row">
      <SidebarNav
        active="Dashboard"
        items={[
          { label: 'Dashboard', icon: LayoutDashboard, active: true },
          { label: 'Departments', icon: Building2 },
          { label: 'Employees', icon: Users },
          {label: 'Reports', icon: FileText},
          {label: 'Policy', icon: Shield},
          { label: 'Settings', icon: Settings },
          { label: 'Audit Logs', icon: ScrollText },
        ]}
      />
      <div className="min-w-0 flex-1 bg-slate-50/50 p-4 sm:p-5">
        <p className="text-sm font-semibold text-slate-900 sm:text-base">Company Admin</p>
        <p className="text-xs text-slate-500 sm:text-sm">ZepEX.ai</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {[
            { label: 'Departments', value: '3' },
            { label: 'Total users', value: '24' },
            { label: 'Pending', value: '5' },
            { label: 'Paid reports', value: '18' },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded-lg border border-slate-200 bg-white p-2.5 sm:p-3"
            >
              <p className="text-[10px] text-slate-500 sm:text-xs">{m.label}</p>
              <p className="mt-0.5 text-base font-bold text-slate-900 sm:text-lg">{m.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-slate-700 sm:text-sm">Reports in pipeline</p>
          {[
            {
              dept: 'Engineering',
              month: 'Jun 2026',
              amount: '₹12,450',
              status: 'Pending manager',
              tone: 'bg-amber-50 text-amber-700',
            },
            {
              dept: 'Sales',
              month: 'Jun 2026',
              amount: '₹8,200',
              status: 'Pending accounts',
              tone: 'bg-indigo-50 text-indigo-700',
            },
            {
              dept: 'Marketing',
              month: 'May 2026',
              amount: '₹5,680',
              status: 'Paid',
              tone: 'bg-emerald-50 text-emerald-700',
            },
          ].map((report) => (
            <div
              key={report.dept}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="h-3.5 w-3.5 shrink-0 text-indigo-600 sm:h-4 sm:w-4" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium sm:text-sm">{report.dept}</p>
                  <p className="text-[10px] text-slate-500 sm:text-xs">
                    {report.month} · {report.amount}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium sm:text-xs',
                  report.tone,
                )}
              >
                {report.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function DashboardPreview() {
  const [activeTab, setActiveTab] = useState<PreviewTab>('employee')

  return (
    <div className="mt-12 sm:mt-16">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <p className="text-sm font-medium text-slate-600">Preview the workspace</p>
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'rounded-md px-4 py-2 text-sm font-medium transition',
                activeTab === tab.id
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-indigo-100/50 sm:rounded-2xl">
        <BrowserChrome
          title={
            activeTab === 'employee'
              ? 'Employee@zepEX.com'
              : 'Admin@zepEX.com'
          }
        />
        {activeTab === 'employee' ? <EmployeePreview /> : <AdminPreview />}
      </div>
    </div>
  )
}
