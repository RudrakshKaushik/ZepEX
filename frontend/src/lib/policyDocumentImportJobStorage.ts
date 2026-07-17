import type { PolicyDocumentImportJob } from '@/hooks/usePolicyDocumentImportPoller'

const STORAGE_KEY = 'zepex:policy-document-import-job'

export function readPolicyDocumentImportJob(): PolicyDocumentImportJob | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PolicyDocumentImportJob
    if (!parsed?.importId || !parsed?.filename || !parsed?.status) return null
    return parsed
  } catch {
    return null
  }
}

export function writePolicyDocumentImportJob(job: PolicyDocumentImportJob | null) {
  try {
    if (!job) {
      sessionStorage.removeItem(STORAGE_KEY)
      return
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(job))
  } catch {
    // Ignore storage failures (private mode, quota, etc.)
  }
}
