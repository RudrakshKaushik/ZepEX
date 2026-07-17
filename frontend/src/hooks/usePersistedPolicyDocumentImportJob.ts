import { useCallback, useEffect, useState } from 'react'
import { getPolicyDocumentPreview } from '@/api'
import {
  readPolicyDocumentImportJob,
  writePolicyDocumentImportJob,
} from '@/lib/policyDocumentImportJobStorage'
import {
  type PolicyDocumentImportJob,
  usePolicyDocumentImportPoller,
} from '@/hooks/usePolicyDocumentImportPoller'
import type { PolicyDocumentPreviewResponse } from '@/types'

export function usePersistedPolicyDocumentImportJob({
  onReady,
  onFailed,
}: {
  onReady: (preview: PolicyDocumentPreviewResponse) => void
  onFailed: (importId: string, message: string) => void
}) {
  const [job, setJobState] = useState<PolicyDocumentImportJob | null>(null)
  const [restored, setRestored] = useState(false)

  const setJob = useCallback((next: PolicyDocumentImportJob | null | ((current: PolicyDocumentImportJob | null) => PolicyDocumentImportJob | null)) => {
    setJobState((current) => {
      const resolved = typeof next === 'function' ? next(current) : next
      writePolicyDocumentImportJob(resolved)
      return resolved
    })
  }, [])

  const handleReady = useCallback(
    (preview: PolicyDocumentPreviewResponse) => {
      setJob({
        importId: preview.import.id,
        filename: preview.import.filename,
        status: 'REVIEW_REQUIRED',
      })
      onReady(preview)
    },
    [onReady, setJob],
  )

  const handleFailed = useCallback(
    (importId: string, message: string) => {
      setJob((current) =>
        current?.importId === importId
          ? { ...current, status: 'FAILED', errorMessage: message }
          : current,
      )
      onFailed(importId, message)
    },
    [onFailed, setJob],
  )

  useEffect(() => {
    let cancelled = false

    async function restore() {
      const stored = readPolicyDocumentImportJob()
      if (!stored) {
        if (!cancelled) setRestored(true)
        return
      }

      try {
        const res = await getPolicyDocumentPreview(stored.importId)
        if (cancelled) return

        const record = res.data.import
        const status = record.status

        if (status === 'IMPORTED') {
          writePolicyDocumentImportJob(null)
          setJobState(null)
          return
        }

        if (status === 'FAILED') {
          const failedJob: PolicyDocumentImportJob = {
            importId: stored.importId,
            filename: stored.filename,
            status: 'FAILED',
            errorMessage: record.error_message || 'Policy extraction failed.',
          }
          setJobState(failedJob)
          writePolicyDocumentImportJob(failedJob)
          return
        }

        if (status === 'REVIEW_REQUIRED') {
          const readyJob: PolicyDocumentImportJob = {
            importId: stored.importId,
            filename: stored.filename,
            status: 'REVIEW_REQUIRED',
          }
          setJobState(readyJob)
          writePolicyDocumentImportJob(readyJob)
          return
        }

        const processingJob: PolicyDocumentImportJob = {
          importId: stored.importId,
          filename: stored.filename,
          status: 'PROCESSING',
        }
        setJobState(processingJob)
        writePolicyDocumentImportJob(processingJob)
      } catch {
        if (!cancelled) {
          writePolicyDocumentImportJob(null)
          setJobState(null)
        }
      } finally {
        if (!cancelled) setRestored(true)
      }
    }

    restore()

    return () => {
      cancelled = true
    }
  }, [])

  usePolicyDocumentImportPoller(restored ? job : null, {
    onReady: handleReady,
    onFailed: handleFailed,
  })

  return { job, setJob, restored }
}
