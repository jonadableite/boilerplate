import { AccountController } from '@/@saas-boilerplate/features/account'
import { ApiKeyController } from '@/@saas-boilerplate/features/api-key/controllers/api-key.controller'
import { AuthController } from '@/@saas-boilerplate/features/auth'
import { InvitationController } from '@/@saas-boilerplate/features/invitation'
import { MembershipController } from '@/@saas-boilerplate/features/membership'
import { OrganizationController } from '@/@saas-boilerplate/features/organization'
import { PlanController } from '@/@saas-boilerplate/features/plan'
import { SessionController } from '@/@saas-boilerplate/features/session'
import { UserController } from '@/@saas-boilerplate/features/user'
import { WebhookController } from '@/@saas-boilerplate/features/webhook'
import { igniter } from '@/igniter'
import { BillingController } from './@saas-boilerplate/features/billing'
import { IntegrationController } from './@saas-boilerplate/features/integration'
import { AppConfig } from './boilerplate.config'
import { LeadController } from './features/lead'
import { SubmissionController } from './features/submission'
import { WhatsAppInstanceController } from './features/whatsapp-instance/controllers/whatsapp-instance.controller'
import { createIgniterAppContext } from './igniter.context'

export const AppRouter = igniter.router({
  baseURL: AppConfig.url,
  basePATH: '/api/v1',
  context: createIgniterAppContext,
  controllers: {
    // SaaS Boilerplate controllers
    account: AccountController,
    apiKey: ApiKeyController,
    auth: AuthController,
    invitation: InvitationController,
    membership: MembershipController,
    organization: OrganizationController,
    integration: IntegrationController,
    user: UserController,
    webhook: WebhookController,
    session: SessionController,
    plan: PlanController,
    billing: BillingController,

    // Custom controllers
    submission: SubmissionController,
    lead: LeadController,
    whatsAppInstances: WhatsAppInstanceController,
  },
})
