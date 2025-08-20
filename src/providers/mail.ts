import { MailProvider } from '@/@saas-boilerplate/providers/mail/mail.provider'
import { AppConfig } from '@/boilerplate.config'
import { getAdapter } from '@/@saas-boilerplate/providers/mail'
import { welcomeEmailTemplate } from '@/content/mails/welcome.email'
import { organizationInviteTemplate } from '@/content/mails/organization-invite'
import { planUpgradeEmailTemplate } from '@/content/mails/billing-plan-upgrade'
import { quotaExceededEmailTemplate } from '@/content/mails/billing-plan-quota-exceed'
import { downgradeEmailTemplate } from '@/content/mails/billing-plan-downgrade'
import { otpCodeEmailTemplate } from '@/content/mails/otp-code'
import { activityNotificationEmailTemplate } from '@/content/mails/activity-notification'

export const mail = MailProvider.initialize({
  secret: AppConfig.providers.mail.secret,
  from: AppConfig.providers.mail.from || 'no-reply@email.com',
  adapter: getAdapter(AppConfig.providers.mail.provider),
  templates: {
    welcome: welcomeEmailTemplate,
    'organization-invite': organizationInviteTemplate,
    'billing-plan-upgrade': planUpgradeEmailTemplate,
    'billing-plan-quota-exceed': quotaExceededEmailTemplate,
    'billing-plan-downgrade': downgradeEmailTemplate,
    'otp-code': otpCodeEmailTemplate,
    notification: activityNotificationEmailTemplate,
  },
})
