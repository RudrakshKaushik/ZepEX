import { useEffect } from 'react'
import { getPolicyDocumentPreview } from '@/api'
import type { PolicyDocumentPreviewResponse } from '@/types'

const POLL_INTERVAL_MS = 2500
const MAX_POLL_MS = 10 * 60 * 1000

function sleep(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}

export type PolicyDocumentImportJob = {
  importId: string
  filename: string
  status: 'PROCESSING' | 'REVIEW_REQUIRED' | 'FAILED'
  errorMessage?: string
}

export function usePolicyDocumentImportPoller(
  job: PolicyDocumentImportJob | null,
  {
    onReady,
    onFailed,
  }: {
    onReady: (preview: PolicyDocumentPreviewResponse) => void
    onFailed: (importId: string, message: string) => void
  },
) {
  useEffect(() => {
    if (!job || job.status !== 'PROCESSING') return

    let cancelled = false
    const started = Date.now()

    async function poll() {
      while (!cancelled && Date.now() - started < MAX_POLL_MS) {
        try {
          const res = await getPolicyDocumentPreview(job.importId)
          const status = res.data.import.status

          if (status === 'PROCESSING' || status === 'UPLOADED') {
            await sleep(POLL_INTERVAL_MS)
            continue
          }

          if (status === 'FAILED') {
            onFailed(
              job.importId,
              res.data.import.error_message || 'Policy extraction failed.',
            )
            return
          }

          onReady(res.data)
          return
        } catch {
          await sleep(POLL_INTERVAL_MS)
        }
      }

      if (!cancelled) {
        onFailed(job.importId, 'Policy extraction timed out. Please try again.')
      }
    }

    poll()

    return () => {
      cancelled = true
    }
  }, [job, onFailed, onReady])
}
