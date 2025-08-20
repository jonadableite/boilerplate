'use client'

import * as React from 'react'
import { Link } from 'next-view-transitions'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { settingsSidebarMenu } from '@/content/menus/settings'
import { useAuth } from '@/@saas-boilerplate/features/auth/presentation/contexts/auth.context'

export function DashboardSettingsSidebar({
  className,
}: {
  className?: string
}) {
  const auth = useAuth()

  return (
    <Sidebar className={className}>
      <SidebarMenu>
        <SidebarHeader>
          <h2 className="text-sm font-semibold ml-2">Settings</h2>
        </SidebarHeader>

        <SidebarContent>
          {settingsSidebarMenu.groups.map((group, index) => (
            <SidebarGroup key={index}>
              <SidebarGroupLabel>{group.name}</SidebarGroupLabel>
              <SidebarGroupContent>
                {group.menu.map((item) => {
                  if (
                    item.url === '/app/settings/organization/billing' &&
                    !auth.session.organization?.billing
                  )
                    return null

                  return (
                    <SidebarMenuItem id={item.title} key={item.title}>
                      <Link
                        href={item.url}
                        className="inline-flex items-center gap-2"
                      >
                        <item.icon className="w-4 h-4" />
                        {item.title}
                      </Link>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </SidebarMenu>
    </Sidebar>
  )
}
