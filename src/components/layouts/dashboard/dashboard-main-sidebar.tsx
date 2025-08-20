'use client'

import * as React from 'react'

import { Link } from 'next-view-transitions'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Logo } from '@/components/ui/logo'
import { OrganizationDashboardSidebarSelector } from '@/@saas-boilerplate/features/organization/presentation/components/organization-dashboard-sidebar-selector'
import { BillingDashboardSidebarUpgradeCard } from '@/@saas-boilerplate/features/billing/presentation/components/billing-dashboard-sidebar-upgrade-card'
import { dashboardSidebarMenu } from '@/content/menus/dashboard'
import { UserDashboardSidebarDropdown } from '@/@saas-boilerplate/features/user/presentation/components/user-dashboard-sidebar-dropdown'

export function DashboardMainSidebar({ className }: { className?: string }) {
  return (
    <Sidebar className={className}>
      <SidebarMenu>
        <SidebarHeader className="pl-7 pt-6 flex items-center justify-between">
          <span
            id="welcome_tour-presentation"
            className="flex items-center space-x-2"
          >
            <Logo size="full" />
          </span>

          <div className="flex items-center !space-x-2">
            <OrganizationDashboardSidebarSelector />
            <UserDashboardSidebarDropdown />
          </div>
        </SidebarHeader>

        <SidebarContent className="mt-4">
          {dashboardSidebarMenu.groups.map(
            (group: {
              id: string
              name: string
              menu: Array<{
                id: string
                title: string
                url: string
                icon: React.ElementType
                items?: Array<{
                  id: string
                  title: string
                  href?: string
                  url?: string
                  icon?: React.ElementType
                }>
              }>
            }) => (
              <SidebarGroup key={group.id}>
                <SidebarGroupLabel>{group.name}</SidebarGroupLabel>
                <SidebarGroupContent>
                  {group.menu.map((item) =>
                    item.items ? (
                      <div id={item.id} key={item.id}>
                        <SidebarMenuSubButton id={`trigger_${item.id}`}>
                          <item.icon className="w-4 h-4" />
                          {item.title}
                        </SidebarMenuSubButton>
                        <SidebarMenuSub id={`sub_${item.id}`}>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.id}>
                              <Link href={subItem.href || subItem.url || '#'}>
                                {subItem.icon && (
                                  <subItem.icon className="w-4 h-4" />
                                )}
                                {subItem.title}
                              </Link>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </div>
                    ) : (
                      <SidebarMenuItem id={item.id} key={item.id}>
                        <Link href={item.url || '#'} className="w-full">
                          <item.icon className="w-4 h-4" />
                          {item.title}
                        </Link>
                      </SidebarMenuItem>
                    ),
                  )}
                </SidebarGroupContent>
              </SidebarGroup>
            ),
          )}
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter className="flex flex-col pt-0 h-auto space-y-4">
          <BillingDashboardSidebarUpgradeCard />
        </SidebarFooter>
      </SidebarMenu>
    </Sidebar>
  )
}
