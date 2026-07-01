import {
  Check,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { SectionBadge } from '@/components/landing/landing-ui'
import { cn } from '@/lib/utils'
import Employee from '@/assets/employee.png'
import Manager from '@/assets/manager.png'
import Accounts from '@/assets/accounts.png'
import Admin from '@/assets/admin.png'
import gemini from '@/assets/gemini.png'
import policy from '@/assets/policy.png'
import approval_flow from '@/assets/approval_flow.png'
import FileSearch from '@/assets/FileSearch3.png'
import blue_arrow from '@/assets/blue_arrow.png'
import star from '@/assets/star.png'

const roles = [
  {
    icon: Employee,
    label: 'Employee',
    description: 'Upload receipts & submit monthly reports',
  },
  {
    icon: Manager,
    label: 'Manager',
    description: 'Review team expenses and approve or reject',
  },
  {
    icon: Accounts,
    label: 'Accounts',
    description: 'Verify receipts and process reimbursements',
  },
  {
    icon: Admin,
    label: 'Admin',
    description: 'Configure departments, policies and users',
  },
]

const workflowSteps = [
  'Employee Uploads Receipt',
  'Ai Extracts & Validates',
  'Manager Approves',
  'Accounts Processes payout',
]

const ctaFeatures = [
  { icon: gemini, label: 'Gemini-powered receipt scanning' },
  { icon: policy, label: 'Policy rules & violation alerts' },
  { icon: approval_flow, label: 'Manager & accounts approval flow' },
  { icon: FileSearch, label: 'Full audit log for compliance' },
]

function CtaButton({
  to,
  children,
  icon,
  darkText,
  bgcolor = 'bg-white',
  className,
}: {
  to: string
  children: string
  icon: 'arrow' | 'plus'
  darkText?: boolean
  bgcolor?: string
  className?: string
}) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-semibold shadow-sm transition hover:opacity-95 sm:w-auto sm:justify-center sm:px-5',
        bgcolor,
        className,
      )}
    >
      <span className={cn('text-left sm:text-center', darkText ? 'text-gray-900' : 'text-[#0066FF]')}>
        {children}
      </span>
      <span className="flex shrink-0 items-center justify-center">
        {icon === 'arrow' ? (
          <img src={blue_arrow} alt="" className="h-8 w-8" />
        ) : (
          <img src={star} alt="" className="h-8 w-8" />
        )}
      </span>
    </Link>
  )
}

export function LandingWorkspaces() {
  return (
    <>
      <section id="workflow" className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Light blue header block */}
          <div className="relative rounded-[2rem] bg-[#FD882C0D] px-6 pb-28 pt-10 sm:px-10 sm:pb-32 sm:pt-12">
            <div className="text-center">
              <SectionBadge endIcon="⊞">Build For Every Role</SectionBadge>
              <h2 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl">
                One Platform, Four Specialized Work-Spaces
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
                Each user lands on a tailored dashboard after sign-in. Admins configure the org;
                employees upload; managers approve; accounts pay out.
              </p>
            </div>
          </div>

          {/* Role cards — overlap blue block edge */}
          <div className="relative z-10 -mt-24 grid gap-4 sm:grid-cols-2 lg:-mt-28 lg:grid-cols-4 px-8">
            {roles.map((role) => (
              <div
                key={role.label}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0066FF] text-white shadow-sm">
                  <img src={role.icon} alt={role.label} className="h-full w-full" />
                </div>
                <p className="mt-5 text-base font-bold text-gray-900">{role.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{role.description}</p>
              </div>
            ))}
          </div>

          {/* Workflow stepper — horizontal scroll on mobile */}
          <div className="relative mt-16 sm:mt-20">
            <div className="landing-scroll-x -mx-4 overflow-x-auto px-4 pb-2 lg:hidden">
              <div className="relative flex min-w-max items-start gap-6 px-2">
                <div className="absolute left-8 right-8 top-[1.35rem] h-1 rounded-full bg-green-500" />
                {workflowSteps.map((step, i) => (
                  <div
                    key={step}
                    className="flex w-[10.5rem] shrink-0 flex-col items-center text-center"
                  >
                    <div
                      className={cn(
                        'relative z-10 flex h-11 w-11 items-center justify-center rounded-full',
                        'bg-green-500 text-white shadow-[0_0_0_4px_white]',
                      )}
                    >
                      <Check className="h-5 w-5" strokeWidth={3} />
                    </div>
                    <p className="mt-4 text-xs text-gray-500">Step {i + 1}</p>
                    <p className="mt-1 text-sm font-bold leading-snug text-gray-900">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative hidden px-2 lg:block">
              <div className="absolute left-[5%] right-[22%] top-[1.35rem] h-1 rounded-full bg-green-500" />
              <div className="grid grid-cols-4 gap-4 px-8">
                {workflowSteps.map((step, i) => (
                  <div key={step} className="flex flex-col">
                    <div
                      className={cn(
                        'relative z-10 flex h-11 w-11 items-center justify-center rounded-full',
                        'bg-green-500 text-white shadow-[0_0_0_4px_white]',
                      )}
                    >
                      <Check className="h-5 w-5" strokeWidth={3} />
                    </div>
                    <p className="mt-4 text-xs text-gray-500">Step {i + 1}</p>
                    <p className="mt-1 max-w-[11rem] text-sm font-bold leading-snug text-gray-900">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blue CTA */}
      <section id="cta" className="bg-white px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-7xl rounded-[2rem] bg-[#0066FF] px-6 py-14 text-center sm:px-12 sm:py-16">
          <h2 className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            Everything Finance Teams Need, Powered by AI
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-blue-100 sm:text-base">
            Preview your complete workspace, manage expenses, track approvals, and access everything
            in one organized place.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-8 lg:grid-cols-4">
            {ctaFeatures.map((item) => (
              <div key={item.label} className="flex flex-col items-center px-1">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <img src={item.icon} alt="" className="h-full w-full" />
                </div>
                <p className="mt-3 text-center text-xs leading-snug text-white sm:mt-4 sm:text-sm">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-stretch gap-3 sm:mt-12 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-4">
            <CtaButton to="/register" icon="arrow">
              Register Your Company
            </CtaButton>
            <CtaButton to="/login" icon="plus" bgcolor="bg-gray-200" darkText>
              Sign In
            </CtaButton>
          </div>
        </div>
      </section>
    </>
  )
}
