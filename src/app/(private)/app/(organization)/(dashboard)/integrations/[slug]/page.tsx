import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Card, CardContent } from '@/components/ui/card'
import {
  PageWrapper,
  PageHeader,
  PageMainBar,
  PageActionsBar,
  PageBody,
} from '@/components/ui/page'
import { api } from '@/igniter.client'
import {
  IntegrationPageBaseInfo,
  IntegrationPageGallery,
  IntegrationPageMetadata,
} from '@/@saas-boilerplate/features/integration/presentation/components'
import { notFound } from 'next/navigation'

type IntegrationDetailsPageProps = {
  params: Promise<{ slug: string }>
}

export const generateMetadata = async ({
  params,
}: IntegrationDetailsPageProps) => {
  const { slug } = await params
  const integration = await (api.integration as any).findOne.query({
    params: { slug },
  })

  if (!integration.data) return notFound()

  return {
    title: integration.data.name,
    description: integration.data.metadata.description,
  }
}
export default async function Page({ params }: IntegrationDetailsPageProps) {
  const { slug } = await params
  const integration = await (api.integration as any).findOne.query({
    params: { slug },
  })

  if (!integration.data) return notFound()

  return (
    <PageWrapper>
      <PageHeader className="border-0">
        <PageMainBar>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/app">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/app/integrations">
                  Integrations
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{integration.data.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </PageMainBar>

        <PageActionsBar></PageActionsBar>
      </PageHeader>

      <PageBody className="flex flex-col">
        <section className="container max-w-screen-md mx-auto space-y-8">
          <IntegrationPageBaseInfo integration={integration.data} />
          <Card>
            <CardContent className="px-4 pt-1 space-y-6">
              <IntegrationPageGallery integration={integration.data} />
              <IntegrationPageMetadata integration={integration.data} />
              {integration.data.metadata.description && (
                <p className="px-4">{integration.data.metadata.description}</p>
              )}
            </CardContent>
          </Card>
        </section>
      </PageBody>
    </PageWrapper>
  )
}

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = false
export const fetchCache = 'auto'
