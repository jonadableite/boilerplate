import type { Metadata } from 'next/types'
import { generateMetadata, getPageMetadata } from '@/utils/metadata.utils'
import { RssIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { XIcon } from '@/components/ui/icons/x-icon'
import { contentLayer } from '@/providers/content-layer'
import { AppConfig } from '@/boilerplate.config'
import { Link } from 'next-view-transitions'
import { ChangelogTimeline } from './(components)/changelog-timeline'
import { SiteCTA } from '../(components)/site-cta'

export const metadata: Metadata = generateMetadata(getPageMetadata('updates'))

export default async function Page() {
  const updates = await contentLayer.listPosts({
    type: 'update',
  })

  return (
    <div className="space-y-0 divide-y pt-16">
      <div className="space-y-16 divide-y">
        <section>
          <div className="container mx-auto max-w-screen-md">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground mb-2 text-xs">
                Novidades
              </span>
              <div className="ml-auto flex items-center space-x-2">
                {AppConfig.links.rss && (
                  <Button variant="ghost" className="rounded-full h-9" asChild>
                    <Link href={AppConfig.links.rss}>
                      Feed RSS <RssIcon className="size-4" />
                    </Link>
                  </Button>
                )}
                {AppConfig.links.twitter && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full h-9"
                    asChild
                  >
                    <Link
                      href={AppConfig.links.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <XIcon className="size-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
            <h1 className="text-xl font-bold mb-4 leading-tight">
              Nossas Últimas Novidades <br /> e Atualizações 🚀
            </h1>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="py-16">
          <div className="container mx-auto max-w-screen-md">
            <ChangelogTimeline
              entries={updates.map((item) => ({
                id: item.slug,
                date: item.data.date,
                title: item.data.title,
                description: item.excerpt,
                tag: item.data.category,
                image: item.data.image as string,
              }))}
            />
          </div>
        </section>

        <SiteCTA className="py-16" />
      </div>
    </div>
  )
}
