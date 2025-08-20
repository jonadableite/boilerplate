import React from 'react'
import { cn } from '@/utils/cn'
import { Markdown } from '@/components/ui/markdown'
import { Link } from 'next-view-transitions'

// Define the type for a changelog entry
export interface ChangelogEntry {
  id: string
  date: string
  title: string
  description: string
  tag: string
  image: string
}

// Props for the ChangelogTimeline component
interface ChangelogTimelineProps {
  entries: ChangelogEntry[]
  className?: string
  showReadMore?: boolean
  baseUrl?: string
}

export function ChangelogTimeline({
  entries,
  className,
}: ChangelogTimelineProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Vertical Timeline Line */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-border/70" />

      {/* Changelog Entries */}
      <div className="space-y-16">
        {entries.map((entry, index) => (
          <div key={entry.id} className="relative pl-8 group">
            {/* Timeline dot */}
            <div
              className={cn([
                'absolute left-[-4px] top-4 size-[8px] rounded-full bg-primary ring-4 ring-background transition-all duration-300 group-hover:bg-primary/80',
                index === 0 && 'bg-primary animation-pulse',
              ])}
            />

            {/* Entry content */}
            <div className="grid grid-cols-[14rem_1fr] items-start gap-10">
              {/* Entry metadata */}
              <div className="flex items-center whitespace-nowrap gap-2 text-xs text-muted-foreground py-3">
                <span className="font-semibold text-foreground">
                  {entry.tag}
                </span>
                <span>•</span>
                <span>{entry.date}</span>
              </div>

              <div className="space-y-4">
                <Link href={`/updates/${entry.id}`}>
                  <img
                    src={entry.image}
                    alt={entry.title}
                    className="w-full h-auto aspect-video object-cover transition-transform duration-500 rounded-md border"
                  />
                </Link>

                {/* Entry title */}
                <main className="space-y-4">
                  <div>
                    <span className="uppercase text-xs text-muted-foreground">
                      {entry.tag}
                    </span>
                    <Link
                      href={`/updates/${entry.id}`}
                      className="text-lg font-semibold tracking-tight hover:text-primary/80 transition-colors"
                    >
                      {entry.title}
                    </Link>
                  </div>

                  {/* Image and description container */}
                  <Markdown>{entry.description}</Markdown>
                </main>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
