'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/utils/cn'

interface User {
  name?: string | null
  image?: string | null
}

interface UserAvatarProps {
  user: User
  className?: string
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  const initials = user.name
    ? user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    : 'U'

  return (
    <Avatar className={cn('h-8 w-8', className)}>
      {user.image ? (
        <AvatarImage src={user.image} alt={user.name || 'User'} />
      ) : null}
      <AvatarFallback className="text-xs font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  )
}