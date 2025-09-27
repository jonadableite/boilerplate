import { Link } from 'next-view-transitions'
import { Metadata } from 'next'
import { generateMetadata, getPageMetadata } from '@/utils/metadata.utils'

import { contentLayer } from '@/providers/content-layer'
import { ArrowUpRightIcon, ChevronRightIcon } from 'lucide-react'
import { SiteCTA } from '../(components)/site-cta'
import { helpCategoriesMenu } from '@/content/menus/help-categories'
import { LinkPreview } from '@/components/ui/link-preview'

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
            Central de Ajuda
          </span>
          <h1 className="text-xl font-bold mb-4 leading-tight">
            Como podemos <br />
            te ajudar hoje? 👋
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Encontre respostas, tutoriais e guias para aproveitar ao máximo
            nossa plataforma de WhatsApp Marketing.
          </p>
        </div>
      </section>
      <section className="pt-16">
        <div className="container mx-auto max-w-screen-md">
          <div className="grid md:grid-cols-3 border rounded-md divide-x bg-secondary">
            {helpCategoriesMenu.map((category) => (
              <div key={category.id} className="group w-full">
                <Link href={category.href} className="group w-full block">
                  <div className="p-6 w-full h-72 flex flex-col justify-between hover:bg-accent transition-all duration-200">
                    <div className="rounded-full bg-primary/10 mb-4 size-10 flex items-center justify-center text-primary">
                      {category.icon}
                    </div>
                    <div>
                      <LinkPreview
                        url={`http://localhost:3000${category.href}`}
                        className="font-semibold group-hover:text-primary transition-colors"
                      >
                        {category.title}
                      </LinkPreview>
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="pt-16">
        <div className="container mx-auto max-w-screen-md">
          <h2 className="text-lg font-semibold mb-6">Artigos Recentes</h2>
          <div className="space-y-4">
            {posts.slice(0, 5).map((post, index) => (
              <LinkPreview
                key={index}
                url={`http://localhost:3000/docs/${post.slug}`}
                className="block"
              >
                <Link
                  href={`/docs/${post.slug}`}
                  className="flex gap-4 p-4 text-sm w-full items-center justify-between hover:bg-secondary cursor-pointer transition-colors rounded-md border"
                >
                  <div>
                    <h3 className="text-sm font-medium">{post.data.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(post.data as any).description ||
                        'Saiba mais sobre este tópico'}
                    </p>
                  </div>
                  <ChevronRightIcon className="size-4" />
                </Link>
              </LinkPreview>
            ))}
          </div>
        </div>
      </section>

      <section className="pt-16">
        <div className="container mx-auto max-w-screen-md">
          <div className="bg-gradient-to-r from-primary/10 to-secondary/40 border rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">
              Ainda precisa de ajuda?
            </h2>
            <p className="text-muted-foreground mb-6">
              Nossa equipe de suporte está sempre pronta para ajudar você a
              alcançar seus objetivos com WhatsApp Marketing.
            </p>
            <div className="flex gap-4 justify-center">
              <LinkPreview
                url="http://localhost:3000/contact"
                className="inline-block"
              >
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Falar com Suporte
                  <ArrowUpRightIcon className="size-4" />
                </Link>
              </LinkPreview>
              <LinkPreview
                url="http://localhost:3000/docs"
                className="inline-block"
              >
                <Link
                  href="/docs"
                  className="inline-flex items-center gap-2 border px-6 py-3 rounded-md hover:bg-secondary transition-colors"
                >
                  Ver Documentação
                  <ArrowUpRightIcon className="size-4" />
                </Link>
              </LinkPreview>
            </div>
          </div>
        </div>
      </section>

      <SiteCTA />
    </div>
  )
}
