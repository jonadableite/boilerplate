import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import {
  PageWrapper,
  PageHeader,
  PageMainBar,
  PageBody,
} from '@/components/ui/page'
import { ApiKeyList } from '@/@saas-boilerplate/features/api-key/presentation/components/api-key-list'
import { api } from '@/igniter.client'
import { Separator } from '@/components/ui/separator'
import { WebhookList } from '@/@saas-boilerplate/features/webhook/presentation'

const availableEvents = [
  'member.invited',
  'member.deleted',
  'member.accepted',
  'member.refused',
  'workspace.updated',
]

export const metadata = {
  title: 'Integrations',
  description:
    "Manage your organization's API keys, webhooks, and third-party integrations",
}

export default async function Page() {
  const apiKeys = await api.apiKey.findManyByOrganization.query()
  const webhooks = await api.webhook.findMany.query()

  if (apiKeys.error || webhooks.error) return null

  return (
    <PageWrapper>
      <PageHeader>
        <PageMainBar>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/app/settings">Settings</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/app/settings/organization">
                  Organization
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Integrations</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </PageMainBar>
      </PageHeader>

      <PageBody className="space-y-8">
        <ApiKeyList apiKeys={apiKeys.data} />
        <Separator className="-ml-[2rem] w-[calc(100%_+_4rem)]" />
        <WebhookList
          webhooks={webhooks.data}
          availableEvents={availableEvents}
        />
      </PageBody>
    </PageWrapper>
  )
}

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = false
export const fetchCache = 'auto'
