import { Metadata } from 'next'
import { generateMetadata, getPageMetadata } from '@/utils/metadata.utils'
import { contentLayer } from '@/providers/content-layer'
import { Markdown } from '@/components/ui/markdown'
import { Button } from '@/components/ui/button'
import { Link } from 'next-view-transitions'
import { ChevronLeftSquareIcon, RssIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AppConfig } from '@/boilerplate.config'
import { XIcon } from '@/components/ui/icons/x-icon'

export const metadata: Metadata = generateMetadata(getPageMetadata('docs'))

export default async function Page() {
  const post = await contentLayer.getPostBySlug(
    'docs',
    'introduction/bem-vindo',
  )
  if (!post) return null
  return (
    <article className="pt-10 marketing-content">
      <header className="border-b pb-8">
        <div className="space-y-8">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="link"
              className="gap-2 rounded-full text-xs"
              size="sm"
              asChild
            >
              <Link href="/docs">
                <ChevronLeftSquareIcon />
                Back to docs
              </Link>
            </Button>
            <div className="ml-auto flex items-center space-x-2">
              {AppConfig.links.rss && (
                <Button variant="ghost" className="rounded-full h-9" asChild>
                  <Link href={AppConfig.links.rss}>
                    RSS Feed <RssIcon className="size-4" />
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

          <div>
            <p className="text-muted-foreground mb-1">
              Published on {post.data.date}
            </p>
            <h1 className="text-2xl max-w-[60%] font-bold mb-8">
              {post.data.title}
            </h1>

            <div className="flex items-center space-x-8 text-sm">
              <div>
                <p className="text-muted-foreground">Published on</p>
                <div className="flex gap-2">{post.data.date}</div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="py-8 space-y-8">
        <Markdown>{post.content}</Markdown>
        <section className="border-t pt-8">
          <main>
            <Badge variant="outline" className="rounded-md mb-4">
              AD
            </Badge>
            <h4 className="font-bold mb-1">Quick Tip</h4>
            <p className="text-sm text-muted-foreground">
              Always implement proper error handling and reconnection logic in
              your SSE clients to ensure a robust user experience.
            </p>

            <Button variant="outline" className="mt-4">
              Learn More
            </Button>
          </main>
        </section>
      </main>
    </article>
  )
}
