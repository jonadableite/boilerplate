'use client'

import { AppConfig } from '@/boilerplate.config'
import { ArrowUpRightIcon } from 'lucide-react'
import { UserAvatar } from '@/components/ui/user-avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { api } from '@/igniter.client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/@saas-boilerplate/features/auth/presentation/contexts/auth.context'

export function UserDashboardSidebarDropdown() {
  const auth = useAuth()
  const router = useRouter()

  const user = auth.session.user

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    try {
      await (api.auth.signOut as any).mutate()
      router.push('/auth')
      toast.success('You have signed out')
    } catch (err) {
      console.error('Sign out error:', err)
      toast.error('Failed to sign out')
    }
  }

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            style={{ zIndex: 9999 }}
          >
            <UserAvatar
              user={user}
              className="size-8 rounded-full border mr-2 cursor-pointer hover:opacity-80 transition-opacity"
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="min-w-56 rounded-lg"
          side="bottom"
          align="start"
          sideOffset={4}
          style={{ zIndex: 9999 }}
        >
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <div className="grid flex-1 text-left text-xs leading-tight space-y-1">
                <span className="truncate font-semibold">{user.name}</span>
                <span className="truncate text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem>My profile</DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => router.push(AppConfig.links.updates)}
            >
              Changelog{' '}
              <ArrowUpRightIcon className="size-2 ml-auto text-muted-foreground" />
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push(AppConfig.links.blog)}>
              Blog{' '}
              <ArrowUpRightIcon className="size-2 ml-auto text-muted-foreground" />
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={() => window.open(`mailto:${AppConfig.links.mail}`)}
            >
              Send feedback{' '}
              <ArrowUpRightIcon className="size-2 ml-auto text-muted-foreground" />
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem className="justify-between hover:bg-transparent cursor-default">
              Theme
              <ThemeToggle />
            </DropdownMenuItem>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => {
              router.push(AppConfig.links.site)
            }}
          >
            View homepage
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
