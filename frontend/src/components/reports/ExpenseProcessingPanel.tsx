import { Loader2 } from 'lucide-react'
import { DashboardPanel } from '@/components/dashboard/DashboardPanel'

interface ExpenseProcessingPanelProps {
  uploadingCount: number
  processingCount: number
}

export function ExpenseProcessingPanel({
  uploadingCount,
  processingCount,
}: ExpenseProcessingPanelProps) {
  const message =
    uploadingCount > 0
      ? `Uploading ${uploadingCount} receipt${uploadingCount === 1 ? '' : 's'}…`
      : `Extracting ${processingCount} receipt${processingCount === 1 ? '' : 's'} with AI…`

  return (
    <DashboardPanel title="My expenses">
      <div className="flex flex-col items-center justify-center px-4 py-12 text-center sm:py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden />
        </div>
        <h3 className="mt-5 text-lg font-semibold text-gray-900">{message}</h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Your upload succeeded. We are reading vendor, amounts, and line items from the receipt.
          Your draft report will appear here in a moment — keep this page open.
        </p>
      </div>
    </DashboardPanel>
  )
}
