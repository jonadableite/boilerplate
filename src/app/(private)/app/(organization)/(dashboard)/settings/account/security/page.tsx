import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  PageWrapper,
  PageBody,
  PageHeader,
  PageMainBar,
} from '@/components/ui/page'
import {
  UserAccountsSettingsForm,
  UserSessionsSettingsForm,
  UserTwoFactorSettingsForm,
} from '@/@saas-boilerplate/features/user/presentation'

export const metadata = {
  title: 'Security',
  description:
    'Manage your account security settings, two-factor authentication, and connected accounts',
}

export default function Page() {
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
                <BreadcrumbLink href="/app/settings/account">
                  Account
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Security</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </PageMainBar>
      </PageHeader>
      <PageBody className="space-y-8">
        <UserAccountsSettingsForm />
        <Separator className="-ml-[2rem] w-[calc(100%_+_4rem)]" />
        <UserTwoFactorSettingsForm />
        <Separator className="-ml-[2rem] w-[calc(100%_+_4rem)]" />
        <UserSessionsSettingsForm />
      </PageBody>
    </PageWrapper>
  )
}

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = false
export const fetchCache = 'auto'
