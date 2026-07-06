import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AdminModalFooter } from '@/components/admin/AdminModalFooter'
import type { CompanyRegistrationRequest } from '@/types'

interface RejectCompanyRequestDialogProps {
  request: CompanyRegistrationRequest | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (requestId: number, rejectReason: string) => void
  loading?: boolean
}

export function RejectCompanyRequestDialog({
  request,
  open,
  onOpenChange,
  onConfirm,
  loading,
}: RejectCompanyRequestDialogProps) {
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    if (!open) {
      setRejectReason('')
    }
  }, [open])

  const handleConfirm = () => {
    if (!request) return
    const reason = rejectReason.trim()
    if (!reason) return
    onConfirm(request.id, reason)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject registration</DialogTitle>
          <DialogDescription>
            {request
              ? `Reject ${request.company_name} (${request.admin_email}). The admin will receive an email with your reason.`
              : 'Provide a reason for rejecting this registration request.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="reject-reason">Rejection reason</Label>
          <Textarea
            id="reject-reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Explain why this registration cannot be approved..."
            rows={4}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            This reason is included in the rejection email sent to the applicant.
          </p>
        </div>

        <AdminModalFooter
          onCancel={() => onOpenChange(false)}
          cancelLabel="Cancel"
          submitLabel="Reject request"
          submitType="button"
          submitting={loading}
          submitDisabled={!rejectReason.trim()}
          onSubmit={handleConfirm}
        />
      </DialogContent>
    </Dialog>
  )
}
