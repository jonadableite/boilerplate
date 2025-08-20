import ReactMarkdown from 'react-markdown'
import { cn } from '@/utils/cn'
import { components } from './mdx-components'

export function Markdown({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'prose prose-neutral dark:prose-invert max-w-none markdown-content',
        className,
      )}
    >
      {/* @ts-expect-error - Expect error */}
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </div>
  )
}
