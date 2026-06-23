export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined

  // Local previews from URL.createObjectURL or data URLs must pass through unchanged.
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url)
      if (parsed.pathname.startsWith('/media/')) {
        return parsed.pathname
      }
    } catch {
      return url
    }
    return url
  }

  return url.startsWith('/') ? url : `/${url}`
}

export function getUserInitial(
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null,
): string {
  const first = firstName?.trim()
  if (first) return first[0].toUpperCase()

  const last = lastName?.trim()
  if (last) return last[0].toUpperCase()

  const mail = email?.trim()
  if (mail) return mail[0].toUpperCase()

  return '?'
}

export function getUserDisplayName(
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null,
): string {
  const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim()
  return fullName || email?.trim() || 'User'
}
