import { ReactNode } from 'react'
import { DocsSidebar } from './(components)/docs-sidebar'

interface DocsLayoutProps {
  children: ReactNode
}

export default function DocsLayout({ children }: DocsLayoutProps) {
  return (
    <div className="border-b">
      <div className="container mx-auto max-w-screen-md gap-8 grid grid-cols-[25%_75%]">
        <div className="border-r pt-6">
          <DocsSidebar />
        </div>
        <div className="w-full">{children}</div>
      </div>
    </div>
  )
}
