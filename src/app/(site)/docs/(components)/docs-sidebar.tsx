import * as React from 'react'
import { Link } from 'next-view-transitions'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { contentLayer } from '@/providers/content-layer'

export async function DocsSidebar() {
  const docs = await contentLayer.listPostsGroupedBy({
    type: 'docs',
    field: 'category',
    orderBy: 'index',
    orderDirection: 'asc',
  })

  return (
    <Sidebar className="h-fit -ml-3">
      <SidebarMenu>
        <SidebarContent>
          {Object.values(docs).map((group) => (
            <SidebarGroup className="pl-0" key={group[0].data.category}>
              <SidebarGroupLabel className="text-muted-foreground mb-4">
                /{group[0].data.category}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                {group.map((item) => (
                  <SidebarMenuItem key={item.data.title}>
                    <Link
                      href={`/docs/${item.slug}`}
                      className="flex-wrap text-wrap text-left leading-normal"
                    >
                      {item.data.title}
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </SidebarMenu>
    </Sidebar>
  )
}
