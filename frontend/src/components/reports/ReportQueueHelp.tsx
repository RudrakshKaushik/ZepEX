import { Info } from 'lucide-react'
import { canApproveExpense, canMarkPaid } from '@/lib/rolePermissions'
import type { User } from '@/types'

interface ReportQueueHelpProps {
  mode: 'pending' | 'approved'
  user: User | null
}

export function ReportQueueHelp({ mode, user }: ReportQueueHelpProps) {
  const showApproval = canApproveExpense(user)
  const showPayment = canMarkPaid(user)

  if (!showApproval && !showPayment) return null

  const approvalText =
    mode === 'pending'
      ? 'Approve expense: reports waiting at your workflow approval step.'
      : 'Approve expense: reports you have already approved in the workflow.'

  const paymentText =
    mode === 'pending'
      ? 'Mark paid: fully approved reports waiting for payment.'
      : 'Mark paid: reports you have marked as paid.'

  return (
    <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
      <div className="flex gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          <p className="font-medium">
            {mode === 'pending' ? 'Pending reports' : 'Approved reports'}
          </p>
          {showApproval && <p>{approvalText}</p>}
          {showPayment && <p>{paymentText}</p>}
          {showApproval && showPayment && (
            <p className="text-blue-800/80">
              You can switch between Pending and Approved in the sidebar to view each queue.
            </p>
          )}
          {showApproval && mode === 'pending' && (
            <p className="text-blue-800/80">
              Approving or rejecting sends a status email to the employee. Rejection requires a
              reason in the notes field.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
