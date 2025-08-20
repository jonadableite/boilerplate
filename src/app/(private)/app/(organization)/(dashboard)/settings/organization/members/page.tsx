import { Separator } from '@/components/ui/separator'
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
import { InvitationList } from '@/@saas-boilerplate/features/invitation/presentation/components/invitation-list.component'
import { api } from '@/igniter.client'
import { MemberList } from '@/@saas-boilerplate/features/membership/presentation/components/member-list.component'

export const metadata = {
  title: 'Members',
  description:
    'Manage your organization members, send invitations, and set member permissions',
}

export default async function Page() {
  const session = await api.auth.getSession.query()
  if (session.error || !session.data) return null

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
                <BreadcrumbPage>Members</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </PageMainBar>
      </PageHeader>
      <PageBody className="space-y-8">
        <MemberList members={session.data.organization?.members ?? []} />
        <Separator className="-ml-[2rem] w-[calc(100%_+_4rem)]" />
        <InvitationList
          invitations={session.data.organization?.invitations ?? []}
        />
      </PageBody>
    </PageWrapper>
  )
}

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = false
export const fetchCache = 'auto'
