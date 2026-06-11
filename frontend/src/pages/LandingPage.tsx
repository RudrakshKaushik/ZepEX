import {
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  FileSearch,
  LineChart,
  Mail,
  Shield,
  Sparkles,
  Upload,
  Users,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { DashboardPreview } from '@/components/landing/DashboardPreview'
import { Button } from '@/components/ui/button'

const stats = [
  { value: '90%', label: 'Less manual data entry' },
  { value: '<30s', label: 'Average receipt processing' },
  { value: '4 roles', label: 'Unified approval workflow' },
  { value: '100%', label: 'Audit trail coverage' },
]

const features = [
  {
    icon: Sparkles,
    title: 'AI receipt extraction',
    description:
      'Gemini reads invoices and receipts — vendor, date, amount, and line items — so employees stop typing expenses by hand.',
  },
  {
    icon: Shield,
    title: 'Real-time policy checks',
    description:
      'Category limits, duplicate detection, and violation flags run automatically before reports reach managers.',
  },
  {
    icon: Users,
    title: 'Role-based workspaces',
    description:
      'Dedicated dashboards for admins, managers, employees, and accounts — each sees only what they need.',
  },
  {
    icon: LineChart,
    title: 'End-to-end visibility',
    description:
      'Track every report from draft upload through manager approval, accounts review, and payout.',
  },
  {
    icon: Mail,
    title: 'Email ingestion',
    description:
      'Forward receipts to your company inbox and ZepEX picks them up, extracts data, and queues them for review.',
  },
  {
    icon: FileSearch,
    title: 'Compliance-ready logs',
    description:
      'Immutable audit logs capture who uploaded, approved, or changed every expense — built for finance teams.',
  },
]

const steps = [
  {
    step: '01',
    title: 'Upload or forward',
    description: 'Employees snap a photo, upload a PDF, or email receipts to your company inbox.',
    icon: Upload,
  },
  {
    step: '02',
    title: 'AI extracts & validates',
    description: 'Our AI engine parses the document, applies your policy rules, and flags anything out of bounds.',
    icon: Bot,
  },
  {
    step: '03',
    title: 'Approve & reimburse',
    description: 'Managers and accounts review in one flow — then mark reports paid with a full audit trail.',
    icon: CheckCircle2,
  },
]

const roles = [
  { role: 'Employee', task: 'Upload receipts & submit monthly reports' },
  { role: 'Manager', task: 'Review team expenses and approve or reject' },
  { role: 'Accounts', task: 'Verify receipts and process reimbursements' },
  { role: 'Admin', task: 'Configure departments, policies, and users' },
]

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50/40 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
              <Zap className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">ZepEX</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
            <a href="#features" className="hover:text-indigo-600">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-indigo-600">
              How it works
            </a>
            <a href="#workflow" className="hover:text-indigo-600">
              Workflow
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="sm:size-default">
                Sign in
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="sm:size-default">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-violet-200/30 blur-3xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:py-24">
          <div>
            {/* <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" />
              AI-powered expense management
            </div> */}
            <h1 className="mt-5 text-3xl font-bold leading-[1.15] tracking-tight sm:mt-6 sm:text-5xl lg:text-6xl">
              Expenses that{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                process themselves
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-600 sm:mt-6 sm:text-lg">
              ZepEX uses AI to capture receipt data, enforce your policies, and route approvals —
              so finance teams spend less time on paperwork and more on what matters.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 sm:mt-8 sm:gap-4">
              <Link to="/register">
                <Button size="lg" className="gap-2">
                  Start free registration <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">
                  Sign in to workspace
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-col gap-2 text-sm text-slate-500 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-x-6">
              {['No credit card required', 'Multi-tenant isolation', 'SOC-ready audit logs'].map(
                (item) => (
                  <span key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-600" />
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-indigo-200/50 to-violet-200/50 blur-2xl sm:-inset-4" />
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-indigo-100/60">
              <img
                src="https://plus.unsplash.com/premium_photo-1725985758251-b49c6b581d17?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="ZepEX AI platform"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/95 to-transparent p-4 sm:p-6">
                <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur-sm sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 sm:h-10 sm:w-10">
                      <Bot className="h-4 w-4 text-indigo-600 sm:h-5 sm:w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium sm:text-sm">AI extraction complete</p>
                      <p className="truncate text-[10px] text-slate-500 sm:text-xs">
                        Starbucks · ₹450.00 · Food · Policy OK
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 sm:px-2.5 sm:text-xs">
                      Valid
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats — marquee on mobile, grid on md+ */}
      <section className="border-y border-slate-200 bg-white py-10 md:py-12">
        <div
          className="overflow-hidden md:hidden"
          style={{
            maskImage:
              'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
          }}
        >
          <div className="stats-marquee-track gap-10 px-4">
            {[...stats, ...stats].map((stat, index) => (
              <div
                key={`${stat.label}-${index}`}
                className="w-36 shrink-0 text-center sm:w-40"
              >
                <p className="text-2xl font-bold text-indigo-700">{stat.value}</p>
                <p className="mt-1 text-xs text-slate-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto hidden max-w-6xl grid-cols-4 gap-8 px-6 md:grid">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-indigo-700">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-indigo-600">
            How it works
          </p>
          <h2 className="mt-3 text-2xl font-bold sm:text-4xl">
            From receipt photo to approved report
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600 sm:text-base">
            ZepEX handles the tedious parts — your team just uploads, reviews, and approves.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:mt-14 sm:gap-8 md:grid-cols-3">
          {steps.map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <span className="text-3xl font-bold text-indigo-200 sm:text-4xl">{item.step}</span>
              <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 sm:h-11 sm:w-11">
                <item.icon className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="mt-4 text-base font-semibold sm:text-lg">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>

        <DashboardPreview />
      </section>

      {/* Features */}
      <section id="features" className="border-t border-slate-200 bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-indigo-600">
              Platform capabilities
            </p>
            <h2 className="mt-3 text-2xl font-bold sm:text-4xl">
              Everything finance teams need, powered by AI
            </h2>
          </div>
          <div className="mt-10 grid gap-5 sm:mt-14 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-slate-200 bg-slate-50/50 p-5 transition hover:border-indigo-200 hover:bg-white hover:shadow-md sm:p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 transition group-hover:bg-indigo-100 sm:h-11 sm:w-11">
                  <feature.icon className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow roles */}
      <section id="workflow" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-indigo-600">
              Built for every role
            </p>
            <h2 className="mt-3 text-2xl font-bold sm:text-4xl">
              One platform, four specialized workspaces
            </h2>
            <p className="mt-4 text-sm text-slate-600 sm:text-base">
              Each user lands on a tailored dashboard after sign-in. Admins configure the org;
              employees upload; managers approve; accounts pay out.
            </p>
            <ul className="mt-8 space-y-4">
              {roles.map((item) => (
                <li key={item.role} className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                    <Building2 className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium">{item.role}</p>
                    <p className="text-sm text-slate-600">{item.task}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100 blur-2xl sm:-inset-4" />
            <div className="relative space-y-3 sm:space-y-4">
              {[
                'Employee uploads receipt',
                'AI extracts & validates',
                'Manager approves',
                'Accounts processes payout',
              ].map((step, i) => (
                <div
                  key={step}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:gap-4 sm:p-4"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white sm:h-8 sm:w-8 sm:text-sm">
                    {i + 1}
                  </span>
                  <p className="min-w-0 flex-1 text-sm font-medium">{step}</p>
                  {i < 3 && (
                    <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-400 sm:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 sm:pb-20">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-8 text-white sm:rounded-3xl sm:p-14">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl sm:h-64 sm:w-64" />
          <div className="relative">
            <h2 className="text-2xl font-bold sm:text-4xl">
              Ready to let AI handle your expenses?
            </h2>
            <p className="mt-4 max-w-xl text-sm text-indigo-100 sm:text-base">
              Register your company today. Once approved, your admin sets up departments, policies,
              and users — and your team starts uploading receipts in minutes.
            </p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {[
                'Gemini-powered receipt scanning',
                'Policy rules & violation alerts',
                'Manager & accounts approval flow',
                'Full audit log for compliance',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-indigo-100">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
              <Link to="/register">
                <Button size="lg" variant="secondary" className="gap-2">
                  Register your company <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10"
                >
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 sm:py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <Zap className="h-4 w-4" />
            </div>
            <span className="font-semibold">ZepEX</span>
            <span className="text-slate-500">· Expense Management</span>
          </div>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} ZepEX. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
