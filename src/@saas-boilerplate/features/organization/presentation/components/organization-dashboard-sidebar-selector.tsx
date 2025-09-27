/* eslint-disable @next/next/no-img-element */
'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/@saas-boilerplate/features/auth/presentation/contexts/auth.context'
import { api } from '@/igniter.client'
import { toast } from 'sonner'
import { CreateOrganizationDialog } from '@/@saas-boilerplate/features/organization/presentation'

export function OrganizationDashboardSidebarSelector() {
  const auth = useAuth()
  const organizations = (api.user.listMemberships as any).useQuery()

  const organization = auth.session.organization

  const handleSetActiveOrganization = async (organizationId: string) => {
    toast.loading('Changing team...')
    await (api.auth.setActiveOrganization as any).mutate({
      body: { organizationId },
    })
    toast.success('Team changed successfully')
    window.location.href = '/app'
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full data-[state=open]:bg-sidebar-accent px-2 data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="size-5 rounded-full">
            <AvatarFallback>{organization?.name[0]}</AvatarFallback>
            <AvatarImage
              src={organization?.logo as string}
              alt={organization?.name}
            />
          </Avatar>
          <div className="grid truncate lowercase flex-1 text-left text-xs leading-tight">
            {organization?.name}
          </div>
          <ChevronsUpDown className="ml-auto" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        align="start"
        sideOffset={4}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          My organizations ({organizations.data?.length})
        </DropdownMenuLabel>
        {!organizations.error &&
          organizations.data?.map((item: any) => (
            <DropdownMenuItem
              key={item.name}
              onClick={() => handleSetActiveOrganization(item.id)}
              className="gap-2 p-2"
            >
              <Avatar className="size-6 bg-primary/10 text-primary rounded-full">
                <AvatarFallback>{item.name[0]}</AvatarFallback>
                <AvatarImage src={item.logo as string} alt={item.name} />
              </Avatar>
              <span>{item.name}</span>

              {organization?.id === item.id && (
                <Check className="size-4 ml-auto" />
              )}
            </DropdownMenuItem>
          ))}
        <DropdownMenuSeparator />
        <CreateOrganizationDialog>
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="gap-2 p-2"
          >
            <div className="flex size-6 items-center justify-center rounded-full border bg-background">
              <Plus className="!size-3" />
            </div>
            <div className="font-medium text-muted-foreground">
              Create organization
            </div>
          </DropdownMenuItem>
        </CreateOrganizationDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
