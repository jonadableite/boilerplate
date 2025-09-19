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

  // Define a ordem desejada das categorias
  const categoryOrder = [
    'introduction',
    'getting-started',
    'ai-agents',
    'whatsapp-instances',
    'warmup',
  ]

  // Ordena os grupos de acordo com a ordem definida
  const sortedGroups = Object.values(docs).sort((a, b) => {
    const categoryA = a[0].data.category
    const categoryB = b[0].data.category
    
    const indexA = categoryOrder.indexOf(categoryA)
    const indexB = categoryOrder.indexOf(categoryB)
    
    // Se a categoria não estiver na lista, coloca no final
    if (indexA === -1 && indexB === -1) return 0
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    
    return indexA - indexB
  })

  return (
    <Sidebar className="h-fit -ml-3">
      <SidebarMenu>
        <SidebarContent>
          {sortedGroups.map((group) => (
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
