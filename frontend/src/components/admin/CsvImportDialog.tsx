import { AlertTriangle, CheckCircle2, FileUp, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { CsvImportOptions } from '@/api'
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
import { Spinner } from '@/components/ui/spinner'
import { fireImportConfetti } from '@/lib/confetti'
import { cn } from '@/lib/utils'
import type { CsvImportResult } from '@/types'
import { toast } from '@/lib/toast'

type ImportStage = 'idle' | 'uploading' | 'processing' | 'complete' | 'error'

export type CsvImportHandler = (
  file: File,
  options?: CsvImportOptions,
) => Promise<{ data: CsvImportResult }>

interface CsvImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onImport: CsvImportHandler
  onSuccess?: () => void
}

const STAGE_LABELS: Record<Exclude<ImportStage, 'idle' | 'error'>, string> = {
  uploading: 'Uploading file…',
  processing: 'Processing rows…',
  complete: 'Import complete',
}

function mapUploadProgress(uploadPercent: number) {
  return Math.min(38, Math.round(uploadPercent * 0.38))
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
  const processingTimerRef = useRef<number | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [stage, setStage] = useState<ImportStage>('idle')
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<CsvImportResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const importing = stage === 'uploading' || stage === 'processing'

  const reset = () => {
    setFile(null)
    setResult(null)
    setErrorMessage('')
    setStage('idle')
    setProgress(0)
    if (processingTimerRef.current !== null) {
      window.clearInterval(processingTimerRef.current)
      processingTimerRef.current = null
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleClose = (next: boolean) => {
    if (importing) return
    if (!next) reset()
    onOpenChange(next)
  }

  useEffect(() => {
    if (!importing) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [importing])

  useEffect(() => {
    return () => {
      if (processingTimerRef.current !== null) {
        window.clearInterval(processingTimerRef.current)
      }
    }
  }, [])

  const startProcessingProgress = () => {
    if (processingTimerRef.current !== null) return

    processingTimerRef.current = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 92) return current
        return current + 2
      })
      setStage((current) => (current === 'uploading' ? 'processing' : current))
    }, 220)
  }

  const stopProcessingProgress = () => {
    if (processingTimerRef.current !== null) {
      window.clearInterval(processingTimerRef.current)
      processingTimerRef.current = null
    }
  }

  const handleImport = async () => {
    if (!file) return

    setResult(null)
    setErrorMessage('')
    setStage('uploading')
    setProgress(5)
    startProcessingProgress()

    try {
      const { data } = await onImport(file, {
        onUploadProgress: (uploadPercent) => {
          setProgress((current) =>
            Math.max(current, mapUploadProgress(uploadPercent)),
          )
          if (uploadPercent >= 100) {
            setStage('processing')
          }
        },
      })

      stopProcessingProgress()
      setProgress(100)
      setResult(data)

      const created = data.created ?? 0
      const updated = data.updated ?? 0
      const skipped = data.skipped ?? 0
      const failed = data.errors?.length ?? 0
      const summary = `${created} created${updated ? `, ${updated} updated` : ''}${skipped ? `, ${skipped} skipped` : ''}${failed ? `, ${failed} errors` : ''}`

      if (data.success !== false) {
        setStage('complete')
        fireImportConfetti()
        toast.success(`Import complete: ${summary}.`)
        onSuccess?.()
        window.setTimeout(() => {
          reset()
          onOpenChange(false)
        }, 1200)
      } else {
        setStage('error')
        setErrorMessage('Import completed with errors. Review the details below.')
        toast.error('Import completed with errors.')
      }
    } catch (err) {
      stopProcessingProgress()
      setStage('error')
      setProgress(0)
      const message = getApiErrorMessage(err)
      setErrorMessage(message)
      toast.error(message)
    }
  }

  const stageLabel =
    stage === 'error'
      ? 'Import failed'
      : stage !== 'idle'
        ? STAGE_LABELS[stage]
        : ''

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn('max-w-md', importing && '[&>button.absolute]:hidden')}
        onInteractOutside={(event) => importing && event.preventDefault()}
        onEscapeKeyDown={(event) => importing && event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {importing && (
          <div className="space-y-4 rounded-lg border border-blue-100 bg-blue-50/70 p-4">
            <div className="flex items-start gap-3">
              <Spinner className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-medium text-blue-950">{stageLabel}</p>
                <p className="text-xs text-blue-800/90">
                  Please do not refresh or close this tab until the import finishes.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-blue-900/80">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-blue-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>Leaving this page may interrupt the import and leave data partially saved.</span>
            </div>
          </div>
        )}

        {stage === 'complete' && (
          <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-green-900">CSV imported successfully</p>
              <p className="text-xs text-green-800">
                {result
                  ? `${result.created ?? 0} created${result.updated ? `, ${result.updated} updated` : ''}${result.skipped ? `, ${result.skipped} skipped` : ''}`
                  : 'Your data has been imported.'}
              </p>
            </div>
          </div>
        )}

        {stage === 'error' && errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {errorMessage}
          </div>
        )}

        {!importing && stage !== 'complete' && (
          <>
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center"
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <Upload className="h-7 w-7 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">Choose a CSV file or click to browse</p>
              {file && <p className="mt-2 text-sm font-medium text-gray-900">{file.name}</p>}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                setResult(null)
                setErrorMessage('')
                setStage('idle')
                setFile(e.target.files?.[0] ?? null)
              }}
            />
          </>
        )}

        {result?.errors && result.errors.length > 0 && !importing && (
          <div className="max-h-40 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {result.errors.map((err, i) => (
              <p key={i}>
                Row {err.row}: {err.message}
              </p>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={importing}
            onClick={() => handleClose(false)}
          >
            Close
          </Button>
          {stage !== 'complete' && (
            <Button type="button" disabled={!file || importing} onClick={handleImport}>
              <FileUp className="h-4 w-4" />
              {importing ? 'Importing…' : 'Import CSV'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
