import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'

interface AdminModalFooterProps {
  onCancel: () => void
  cancelLabel?: string
  submitLabel: string
  submitDisabled?: boolean
  submitting?: boolean
  submitType?: 'button' | 'submit'
  onSubmit?: () => void
  extra?: ReactNode
}

export function AdminModalFooter({
  onCancel,
  cancelLabel = 'Cancel',
  submitLabel,
  submitDisabled,
  submitting,
  submitType = 'submit',
  onSubmit,
  extra,
}: AdminModalFooterProps) {
  return (
    <DialogFooter className="gap-2 sm:justify-end">
      {extra}
      <Button type="button" variant="destructive" onClick={onCancel} disabled={submitting}>
        {cancelLabel}
      </Button>
      <Button
        type={submitType}
        disabled={submitDisabled || submitting}
        onClick={submitType === 'button' ? onSubmit : undefined}
      >
        {submitting ? 'Please wait...' : submitLabel}
      </Button>
    </DialogFooter>
  )
}
