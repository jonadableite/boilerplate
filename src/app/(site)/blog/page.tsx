import { Link } from 'next-view-transitions'
import { Metadata } from 'next'
import { generateMetadata, getPageMetadata } from '@/utils/metadata.utils'

import { ArrowUpRightIcon, RssIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { XIcon } from '@/components/ui/icons/x-icon'
import { contentLayer } from '@/providers/content-layer'
import { formatRelative, parseISO } from 'date-fns'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { SiteCTA } from '../(components)/site-cta'
import { AppConfig } from '@/boilerplate.config'

export const metadata: Metadata = generateMetadata(getPageMetadata('blog'))

export default async function Page() {
  const posts = await contentLayer.listPosts({ type: 'blog' })

  const latest = posts.slice(3)
  const featured = posts.slice(0, 3)

  return (
    <div className="space-y-16 divide-y pt-16">
      <section>
        <div className="container mx-auto max-w-screen-md">
          <span className="text-muted-foreground mb-2 text-xs">Blog</span>
          <h1 className="text-xl font-bold mb-4 leading-tight">
            Our Lastest Updates <br /> about {AppConfig.name} 👋
          </h1>
        </div>
      </section>

      {/* Timeline Section */}
      <div className="space-y-16 divide-y">
        <section className="pt-16">
          <div className="container mx-auto max-w-screen-md">
            <div className="grid md:grid-cols-3 bg-secondary border rounded-md divide-x">
              {featured.map((post) => (
                <Link
                  href={`/blog/${post.slug}`}
                  key={post.id}
                  className="group w-full"
                >
                  <div className="p-6 w-full h-72 flex flex-col justify-between hover:bg-accent transition-all duration-200">
                    <div>
                      <div className="flex flex-col space-y-2 text-xs">
                        <Avatar className="size-4">
                          <AvatarFallback>
                            {post.data.author?.[0]}
                          </AvatarFallback>
                          <AvatarImage src={post.data.authorImage} />
                        </Avatar>
                        <span>{post.data.author}</span>
                      </div>
                      {post.data.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs text-primary font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-auto">
                      <span className="flex items-center text-xs opacity-60 mb-2">
                        {formatRelative(parseISO(post.data.date), new Date())}
                      </span>
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors mb-2">
                        {post.data.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="mt-4 flex items-center text-xs text-primary font-medium">
                        <span>Read more</span>
                        <ArrowUpRightIcon className="ml-1 size-3 opacity-30" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="pt-16 space-y-8">
          <header>
            <div className="container mx-auto max-w-screen-md">
              <h2 className="font-bold text-lg">Últimos artigos</h2>
            </div>
          </header>
          <main className="container mx-auto max-w-screen-md">
            <div className="border rounded-md divide-y">
              {latest.map((post) => (
                <Link
                  href={`/blog/${post.slug}`}
                  key={post.id}
                  className="group block"
                >
                  <div className="p-6 hover:bg-secondary/80 transition-all duration-200 space-y-8">
                    <main>
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                        {post.data.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {post.excerpt}
                      </p>
                    </main>

                    <footer className="flex items-end h-full space-x-4">
                      <div className="flex flex-col space-y-2 text-xs">
                        <Avatar className="size-4">
                          <AvatarFallback>
                            {post.data.author?.[0]}
                          </AvatarFallback>
                          <AvatarImage src={post.data.authorImage} />
                        </Avatar>
                        <span>{post.data.author}</span>
                      </div>
                      <div className="flex items-center text-xs opacity-60">
                        {formatRelative(parseISO(post.data.date), new Date())}
                      </div>
                      <div>
                        {post.data.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs text-primary font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </footer>
                  </div>
                </Link>
              ))}
            </div>
          </main>
        </section>
      </div>

      <SiteCTA className="py-16" />
    </div>
  )
}
