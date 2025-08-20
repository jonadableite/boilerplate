'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  FacebookIcon,
  Link2Icon,
  LinkedinIcon,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { XIcon } from '@/components/ui/icons/x-icon'
import type {
  ContentHeading,
  ContentTypeResult,
} from '@/@saas-boilerplate/providers/content-layer/types'
import {
  getContentShareUrl,
  useContentLayer,
} from '@/@saas-boilerplate/hooks/use-content-layer'

/**
 * Props for the TableOfContents component
 * @interface TableOfContentsProps
 */
interface TableOfContentsProps {
  /** Optional className for styling customization */
  className?: string
  /** Content object containing the article data and headings */
  content: ContentTypeResult
}

/**
 * TableOfContents component that displays a hierarchical navigation structure
 * for article headings and social sharing options, with accordion functionality.
 *
 * @component
 * @param {TableOfContentsProps} props - The component props
 * @returns {JSX.Element | null} The rendered component or null if no headings are present
 */
export function SiteTableOfContents({
  className,
  content,
}: TableOfContentsProps) {
  // Use the ContentLayer hook to manage active state and heading navigation
  const { isHeadingActive, scrollToHeading } = useContentLayer(content, {
    scrollOffset: 100,
    updateDelay: 100,
  })

  // State to track which headings are expanded (all collapsed by default)
  const [expandedHeadings, setExpandedHeadings] = useState<
    Record<string, boolean>
  >({})

  // Toggle a heading's expanded state
  const toggleHeading = (id: string) => {
    setExpandedHeadings((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  // If no headings are present, don't render the component
  if (!content.headings || content.headings.length === 0) {
    return null
  }

  /**
   * Recursively renders headings and their children with proper indentation and styling
   *
   * @param {ContentHeading[]} headings - Array of heading objects to render
   * @param {number} depth - Current nesting depth for indentation
   * @returns {JSX.Element[]} Array of rendered heading elements
   */
  const renderHeadings = (headings: ContentHeading[], depth = 0) => {
    return headings.map((heading) => {
      const isActive = isHeadingActive(heading)

      const isExpanded = !!expandedHeadings[heading.id]
      const hasChildren = heading.items && heading.items.length > 0

      return (
        <div key={heading.id} className={cn(depth > 0 && 'ml-4')}>
          <div className="flex items-center">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleHeading(heading.id)
                }}
                className="mr-1 p-0.5 rounded-sm hover:bg-secondary/80 transition-colors"
                aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                >
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </motion.div>
              </button>
            )}

            <a
              href={`#${heading.id}`}
              onClick={(e) => {
                e.preventDefault()
                scrollToHeading(heading.id)

                // Auto-expand when clicking on a heading with children
                if (hasChildren && !isExpanded) {
                  toggleHeading(heading.id)
                }
              }}
              className={cn(
                'block py-1 px-2 rounded-md transition-all duration-200 flex-1',
                heading.level === 1 ? 'font-bold' : '',
                heading.level === 2 ? 'font-medium' : '',
                heading.level > 2 ? 'text-muted-foreground text-[0.8rem]' : '',
                isActive
                  ? 'bg-secondary text-primary font-medium'
                  : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground',
              )}
            >
              {heading.title}
            </a>
          </div>

          {/* Render child headings with animation, only if this heading is expanded */}
          {hasChildren && (
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div
                    className={cn(
                      'ml-2 space-y-1 border-l pl-2 mt-1',
                      isActive ? 'border-primary' : 'border-muted',
                    )}
                  >
                    {renderHeadings(heading.items, depth + 1)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      )
    })
  }

  // Get the sharing URL for social media
  const shareUrl = getContentShareUrl(content)

  return (
    <div className={cn('bg-secondary p-4 rounded-md sticky top-24', className)}>
      <div className="space-y-4 !text-xs">
        {/* @ts-expect-error - Error expected */}
        <h4 className="font-semibold">{content.data.title}</h4>

        <nav className="space-y-1">{renderHeadings(content.headings)}</nav>

        {/* Social sharing section */}
        <div className="border-t pt-4 mt-4 space-y-4">
          <button
            onClick={() => {
              navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Link copied to clipboard')
              })
            }}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Link2Icon className="h-3.5 w-3.5" />
            Copy article URL
          </button>
          <button
            onClick={() => {
              window.open(
                `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`,
                '_blank',
              )
            }}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <XIcon className="h-3.5 w-3.5" />
            Share on X
          </button>
          <button
            onClick={() => {
              window.open(
                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
                '_blank',
              )
            }}
            className="flex items-center justify-start text-left gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <FacebookIcon className="h-3.5 w-3.5" />
            Share on Facebook
          </button>
          <button
            onClick={() => {
              window.open(
                `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
                '_blank',
              )
            }}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LinkedinIcon className="h-3.5 w-3.5" />
            Share on Linkedin
          </button>
        </div>
      </div>
    </div>
  )
}
