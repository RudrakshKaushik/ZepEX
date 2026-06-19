import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AdminModalFooter } from '@/components/admin/AdminModalFooter'

interface AdminConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  loading?: boolean
}

export function AdminConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Deactivate',
  onConfirm,
  loading,
}: AdminConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <AdminModalFooter
          onCancel={() => onOpenChange(false)}
          cancelLabel="Cancel"
          submitLabel={confirmLabel}
          submitType="button"
          submitting={loading}
          onSubmit={onConfirm}
        />
      </DialogContent>
    </Dialog>
  )
}
