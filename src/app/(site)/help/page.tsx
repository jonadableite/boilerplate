import { Link } from 'next-view-transitions'
import { Metadata } from 'next'
import { generateMetadata, getPageMetadata } from '@/utils/metadata.utils'

import { contentLayer } from '@/providers/content-layer'
import { ArrowUpRightIcon, ChevronRightIcon } from 'lucide-react'
import { SiteCTA } from '../(components)/site-cta'
import { helpCategoriesMenu } from '@/content/menus/help-categories'

export const metadata: Metadata = generateMetadata(getPageMetadata('help'))

export default async function Page() {
  const posts = await contentLayer.listPosts({
    type: 'help',
  })

  return (
    <div className="space-y-16 divide-y pt-16">
      <section>
        <div className="container mx-auto max-w-screen-md">
          <span className="text-muted-foreground mb-2 text-xs">
            Help Center
          </span>
          <h1 className="text-xl font-bold mb-4 leading-tight">
            How we can <br />
            help you today? 👋
          </h1>
        </div>
      </section>
      <section className="pt-16">
        <div className="container mx-auto max-w-screen-md">
          <div className="grid md:grid-cols-3 border rounded-md divide-x bg-secondary">
            {helpCategoriesMenu.map((category) => (
              <Link
                href={category.href}
                key={category.id}
                className="group w-full"
              >
                <div className="p-6 w-full h-72 flex flex-col justify-between hover:bg-accent transition-all duration-200">
                  <div className="rounded-full bg-primary/10 mb-4 size-10 flex items-center justify-center text-primary">
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {category.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                    <div className="mt-4 flex items-center text-xs text-primary font-medium">
                      <span>See articles</span>
                      <ArrowUpRightIcon className="ml-1 size-3 opacity-30" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="pt-16">
        <div className="container mx-auto max-w-screen-md">
          <header>
            <h2 className="text-lg font-bold mb-8">Artigos populares</h2>
          </header>
          <main className="border rounded-md overflow-hidden divide-y">
            {/* Add content for popular articles here, such as a list or cards */}
            {posts.map((post, index) => (
              <Link
                href={`/help/${post.slug}`}
                key={index}
                className="flex gap-4 p-4 text-sm w-full items-center justify-between hover:bg-secondary cursor-pointer transition-colors"
              >
                <h3 className="text-sm">
                  <span className="font-semibold text-primary">
                    /{post.data.category}
                  </span>{' '}
                  - {post.data.title}
                </h3>
                <ChevronRightIcon className="size-4" />
              </Link>
            ))}
          </main>
        </div>
      </section>

      <SiteCTA />
    </div>
  )
}
