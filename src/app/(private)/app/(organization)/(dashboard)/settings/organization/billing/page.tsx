import {
  PageWrapper,
  PageHeader,
  PageMainBar,
  PageBody,
} from '@/components/ui/page'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { CurrentTierSection } from '@/@saas-boilerplate/features/billing/presentation/components/billing-current-tier-section'
import { BillingCurrentUsageSection } from '@/@saas-boilerplate/features/billing/presentation/components/billing-current-usage-section'
import { BillingChangeEmailSection } from '@/@saas-boilerplate/features/billing/presentation/components/billing-change-email-form'

export const metadata = {
  title: 'Billing',
  description:
    "Manage your organization's billing information, subscription plan, and usage metrics",
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
                <BreadcrumbLink href="/app/settings/organization">
                  Organization
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Billing</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </PageMainBar>
      </PageHeader>
      <PageBody className="space-y-8">
        <CurrentTierSection />
        <div className="pb-1">
          <Separator className="absolute left-0" />
        </div>
        <BillingCurrentUsageSection />
        <div className="pb-1">
          <Separator className="absolute left-0" />
        </div>
        <BillingChangeEmailSection />
      </PageBody>
    </PageWrapper>
  )
}

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = false
export const fetchCache = 'auto'
