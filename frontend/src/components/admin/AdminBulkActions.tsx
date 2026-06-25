import { Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminBulkActionsProps {
  onImport: () => void
  onDownloadTemplate: () => void
  importLabel?: string
  disabled?: boolean
}

export function AdminBulkActions({
  onImport,
  onDownloadTemplate,
  importLabel = 'Import CSV',
  disabled,
}: AdminBulkActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" onClick={onDownloadTemplate} disabled={disabled}>
        <Download className="h-4 w-4" />
        Download template
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onImport} disabled={disabled}>
        <Upload className="h-4 w-4" />
        {importLabel}
      </Button>
    </div>
  )
}
