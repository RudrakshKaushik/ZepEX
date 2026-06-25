import { FileUp, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { getApiErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { CsvImportResult } from '@/types'
import { toast } from '@/lib/toast'

interface CsvImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onImport: (file: File) => Promise<{ data: CsvImportResult }>
  onSuccess?: () => void
}

export function CsvImportDialog({
  open,
  onOpenChange,
  title,
  description,
  onImport,
  onSuccess,
}: CsvImportDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<CsvImportResult | null>(null)

  const reset = () => {
    setFile(null)
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleClose = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    try {
      const { data } = await onImport(file)
      setResult(data)
      const created = data.created ?? 0
      const updated = data.updated ?? 0
      const skipped = data.skipped ?? 0
      const failed = data.errors?.length ?? 0
      if (data.success !== false) {
        toast.success(
          `Import complete: ${created} created${updated ? `, ${updated} updated` : ''}${skipped ? `, ${skipped} skipped` : ''}${failed ? `, ${failed} errors` : ''}.`,
        )
        onSuccess?.()
      } else {
        toast.error('Import completed with errors.')
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div
          className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center"
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <Upload className="h-7 w-7 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">Choose a CSV file or click to browse</p>
          {file && (
            <p className="mt-2 text-sm font-medium text-gray-900">{file.name}</p>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            setResult(null)
            setFile(e.target.files?.[0] ?? null)
          }}
        />

        {result?.errors && result.errors.length > 0 && (
          <div className="max-h-40 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {result.errors.map((err, i) => (
              <p key={i}>
                Row {err.row}: {err.message}
              </p>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => handleClose(false)}>
            Close
          </Button>
          <Button type="button" disabled={!file || importing} onClick={handleImport}>
            <FileUp className="h-4 w-4" />
            {importing ? 'Importing…' : 'Import CSV'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
