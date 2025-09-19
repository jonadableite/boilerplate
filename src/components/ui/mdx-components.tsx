import { Link } from 'next-view-transitions'
import React, { DetailedHTMLProps, HTMLAttributes } from 'react'

import { MDXComponents } from 'mdx/types'
import { cn } from '@/utils/cn'
import { Callout } from './mdx-callout'
import { MdxCard } from './mdx-card'

type HeadingProps = DetailedHTMLProps<
  HTMLAttributes<HTMLHeadingElement>,
  HTMLHeadingElement
>
type ParagraphProps = DetailedHTMLProps<
  HTMLAttributes<HTMLParagraphElement>,
  HTMLParagraphElement
>
type PreProps = DetailedHTMLProps<
  HTMLAttributes<HTMLPreElement>,
  HTMLPreElement
>
type CodeProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>
type AnchorProps = DetailedHTMLProps<
  HTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
> & {
  href?: string
}

// MDX components mapping
export const components: MDXComponents = {
  h1: ({ children, ...props }: HeadingProps) => (
    <h1 className="scroll-m-20 text-xl font-bold tracking-tight" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: HeadingProps) => (
    <h2
      className="scroll-m-20 border-b border-border pb-2 text-lg font-semibold tracking-tight"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: HeadingProps) => (
    <h3 className="scroll-m-20 text-md font-semibold tracking-tight" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }: ParagraphProps) => (
    <p className="leading-7 text-sm text-muted-foreground mb-6" {...props}>
      {children}
    </p>
  ),
  a: ({ children, href = '', ...props }: AnchorProps) => {
    const isListItem = props.className?.includes('list-item')

    if (href.startsWith('http')) {
      return (
        <a
          href={href}
          className={cn(
            'font-medium no-underline',
            isListItem
              ? 'block p-4 hover:bg-muted hover:shadow-md transition-all duration-200'
              : 'hover:text-primary',
          )}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      )
    }

    return (
      <Link
        href={href}
        className={cn(
          'font-medium no-underline',
          isListItem
            ? 'block p-4 hover:bg-muted hover:shadow-md transition-all duration-200'
            : 'hover:text-primary',
        )}
        {...props}
      >
        {children}
      </Link>
    )
  },
  pre: ({ children, ...props }: PreProps) => (
    <div className="relative border border-border rounded-md overflow-hidden shadow-md bg-background mb-6">
      <div className="flex items-center justify-between px-4 py-4 bg-secondary/20 border-b border-border">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500 hover:opacity-80 transition-opacity" />
          <div className="w-3 h-3 rounded-full bg-yellow-500 hover:opacity-80 transition-opacity" />
          <div className="w-3 h-3 rounded-full bg-green-500 hover:opacity-80 transition-opacity" />
        </div>
      </div>
      <pre
        {...props}
        className="p-4 m-0 overflow-x-auto bg-secondary text-foreground"
      >
        {React.Children.map(children, (child, index) =>
          React.isValidElement(child)
            ? React.cloneElement(child, {
              key: `code-${index}`,
              // @ts-expect-error - Error
              className: cn(child.props.className, 'hljs'),
              style: {
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              },
            })
            : child,
        )}
      </pre>
    </div>
  ),
  code: ({ children, ...props }: CodeProps) => {
    const className = props.className as string
    if (className?.includes('hljs')) {
      return children
    }

    return (
      <code className="inline-flex bg-secondary px-1 rounded-md" {...props}>
        {children}
      </code>
    )
  },
  table: ({ ...props }) => (
    <div className="my-6 w-full overflow-y-auto rounded-md border border-border bg-secondar/50">
      <table className="w-full border-collapse border-border" {...props} />
    </div>
  ),
  thead: ({ ...props }) => (
    <thead className="border-b border-border bg-muted" {...props} />
  ),
  tbody: ({ ...props }) => (
    <tbody className="[&_tr:last-child]:border-0" {...props} />
  ),
  tr: ({ ...props }) => (
    <tr
      className="border-b border-border transition-colors hover:bg-muted/50"
      {...props}
    />
  ),
  th: ({ ...props }) => (
    <th
      className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
      {...props}
    />
  ),
  td: ({ ...props }) => (
    <td className="p-4 align-middle [&:has([role=checkbox])]:pr-0" {...props} />
  ),
  Callout,
  Card: MdxCard,
}
