import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getSetupLabel, getVisibleSetupEntries, SETUP_LINKS } from '@/lib/adminSetup'
import { cn } from '@/lib/utils'

interface AdminSetupChecklistProps {
  setup: Record<string, boolean>
}

export function AdminSetupChecklist({ setup }: AdminSetupChecklistProps) {
  const entries = getVisibleSetupEntries(setup)

  return (
    <div className="overflow-hidden rounded-lg border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="border-b border-[#e2e8f0] px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold text-gray-900">Setup Checklist</h2>
        <p className="mt-1 text-sm text-gray-500">
          Track required setup steps and complete your workspace configuration with a guided
          checklist.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 px-5 py-4 sm:px-6 sm:py-5">
        {entries.map(([key, done]) => {
          const link = !done ? SETUP_LINKS[key] : undefined
          const className = cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium',
            done
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-gray-200 bg-gray-50 text-gray-500',
            link && 'transition-colors hover:border-primary hover:bg-blue-50 hover:text-primary',
          )

          const label = (
            <>
              {done && <Check className="h-3.5 w-3.5 shrink-0 text-green-600" />}
              {getSetupLabel(key)}
            </>
          )

          return link ? (
            <Link key={key} to={link} className={className}>
              {label}
            </Link>
          ) : (
            <span key={key} className={className}>
              {label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
