import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { getUserInitial, resolveMediaUrl } from '@/lib/userDisplay'

const sizeClasses = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
} as const

interface UserAvatarProps {
  src?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  name?: string | null
  size?: keyof typeof sizeClasses
  className?: string
}

export function UserAvatar({
  src,
  firstName,
  lastName,
  email,
  name,
  size = 'sm',
  className,
}: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const imageUrl = !imageFailed ? resolveMediaUrl(src) : undefined

  useEffect(() => {
    setImageFailed(false)
  }, [src])

  const initial = name?.trim()
    ? name.trim()[0].toUpperCase()
    : getUserInitial(firstName, lastName, email)

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        onError={() => setImageFailed(true)}
        className={cn(
          'shrink-0 rounded-full object-cover bg-gray-100',
          sizeClasses[size],
          className,
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-white',
        sizeClasses[size],
        className,
      )}
      aria-hidden
    >
      {initial}
    </div>
  )
}
