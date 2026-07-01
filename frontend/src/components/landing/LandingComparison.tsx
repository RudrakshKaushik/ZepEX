import { Check, X } from 'lucide-react'
import { SectionIntro } from '@/components/landing/landing-ui'
import { cn } from '@/lib/utils'

const competitorPainPoints = [
  'Requires app installation for expense submission',
  'Multiple manual steps before reports can be submitted',
  'Limited flexibility across payment methods',
  'Policy validation happens after submission',
  'Manual policy reviews create approval delays',
  'Inconsistent policy enforcement across teams',
  'Limited support for global entities and currencies',
  'Batch processing delays reimbursement cycles',
  'Additional setup required for international teams',
  'Limited HR and ERP integrations',
  'Custom integrations require extra development',
]

const zepExAdvantages = [
  'Submit receipts directly via email',
  'No mobile app required for employees',
  'Supports any card, bank, or payment method',
  'Policies validated before submission',
  'Automatic approval rule enforcement',
  'Role, department, and client-specific policies',
  'Native multi-currency support',
  'Real-time processing with no batch delays',
  'Designed for distributed teams worldwide',
  'Connect with HRIS and ERP platforms',
  'Native integration marketplace',
]

function CompareListItem({
  children,
  variant,
}: {
  children: string
  variant: 'competitor' | 'zep'
}) {
  const isCompetitor = variant === 'competitor'

  return (
    <li
      className={cn(
        'flex items-center gap-3 rounded-lg px-3.5 py-2.5',
        isCompetitor ? 'bg-[#FFF0F0]' : 'bg-[#EDF5FF]',
      )}
    >
      <span
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white',
          isCompetitor ? 'bg-[#EF4444]' : 'bg-[#0066FF]',
        )}
      >
        {isCompetitor ? (
          <X className="h-3 w-3" strokeWidth={3} />
        ) : (
          <Check className="h-3 w-3" strokeWidth={3} />
        )}
      </span>
      <span className="text-[13px] leading-snug text-gray-800 sm:text-sm">{children}</span>
    </li>
  )
}

function CompareColumn({
  title,
  items,
  variant,
}: {
  title: string
  items: string[]
  variant: 'competitor' | 'zep'
}) {
  const isCompetitor = variant === 'competitor'

  return (
    <div
      className={cn(
        'h-full rounded-[28px] p-6 shadow-sm',
        isCompetitor
          ? 'bg-gradient-to-b from-[#FFD5C8] via-[#FECACA] to-[#FCA5A5]'
          : 'bg-gradient-to-b from-[#BAE6FD] via-[#93C5FD] to-[#60A5FA]',
      )}
    >
      <div className="flex h-full flex-col rounded-[22px] bg-white px-5 py-6 sm:px-7 sm:py-8">
        <h3 className="text-lg font-bold text-gray-900 sm:text-xl">{title}</h3>
        <ul className="mt-5 space-y-2">
          {items.map((item) => (
            <CompareListItem key={item} variant={variant}>
              {item}
            </CompareListItem>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function LandingComparison() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionIntro
          badge="View The Dashboards"
          badgeEndIcon="⊞"
          title="Approve Only When Needed"
          description="Every reimbursement is automatically checked against your company policies. If everything is correct, it goes directly to the payment team. Only reimbursements with policy violations are sent for approval helping employees get reimbursed faster and saving valuable time for finance teams."
        />

        <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
          <CompareColumn title="Market Competitors" items={competitorPainPoints} variant="competitor" />
          <CompareColumn title="ZepEX" items={zepExAdvantages} variant="zep" />
        </div>
      </div>
    </section>
  )
}
