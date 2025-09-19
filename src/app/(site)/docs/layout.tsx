import { ReactNode } from 'react'
import { DocsSidebar } from './(components)/docs-sidebar'

interface DocsLayoutProps {
  children: ReactNode
}

export default function DocsLayout({ children }: DocsLayoutProps) {
  return (
    <div className="border-b">
      <div className="container mx-auto max-w-screen-xl gap-8 grid grid-cols-[280px_1fr] py-8">
        <div className="border-r pr-6">
          <div className="sticky top-8">
            <DocsSidebar />
          </div>
        </div>
        <div className="w-full max-w-4xl">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
