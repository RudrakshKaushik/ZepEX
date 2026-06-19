import { FileText } from 'lucide-react'
import type { PolicyRule } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface AdminPolicyRuleCardProps {
  rule: PolicyRule
  onEdit?: () => void
}

export function AdminPolicyRuleCard({ rule, onEdit }: AdminPolicyRuleCardProps) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="flex w-full items-center gap-4 border-b border-[#e2e8f0] px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-gray-50/60 sm:px-6"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
        <FileText className="h-5 w-5 text-gray-700" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold capitalize text-gray-900">
          {rule.category_name.replace(/_/g, ' ')}
        </p>
        <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{rule.category_description}</p>
      </div>
      <p className="shrink-0 text-lg font-bold text-gray-900">
        {formatCurrency(rule.max_amount)}
      </p>
    </button>
  )
}
