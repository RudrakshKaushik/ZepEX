function normalizeBackendOrigin(host: string): string {
  const trimmed = host.trim().replace(/\/$/, '')
  return trimmed.startsWith('http') ? trimmed : `http://${trimmed}`
}

export function getBackendOrigin(): string | undefined {
  const host = import.meta.env.VITE_BACKEND_HOST?.trim()
  if (!host) return undefined
  return normalizeBackendOrigin(host)
}

export function getApiBaseUrl(): string {
  const origin = getBackendOrigin()
  return origin ? `${origin}/api` : '/api'
}

export function resolveBackendAssetUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path
  }

  const normalized = path.startsWith('/') ? path : `/${path}`
  const origin = getBackendOrigin()
  return origin ? `${origin}${normalized}` : normalized
}
