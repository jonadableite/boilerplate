import * as ReactEmail from '@react-email/components'

import { z } from 'zod'
import { Footer } from './components/footer'
import { AppConfig } from '@/boilerplate.config'
import { String, Url } from '@/@saas-boilerplate/utils'
import { MailProvider } from '@/@saas-boilerplate/providers/mail'
import { Logo } from '@/components/ui/logo'
import { Button } from './components/button'

/**
 * Schema definition for the quota exceeded email template
 */
const schema = z.object({
  email: z.string().email(),
  organizationName: z.string(),
  organizationPlan: z.string(),
})

/**
 * Email template for when a organization exceeds their plan quota limit
 * @template {typeof schema}
 * @param {object} props Template properties
 * @param {string} props.email - User's email address
 * @param {string} props.organizationName - Name of the organization
 * @param {string} props.organizationPlan - Current subscription plan name
 * @returns {JSX.Element} Rendered email template
 */
export const quotaExceededEmailTemplate = MailProvider.template({
  subject: `Your Team Has Reached Its Usage Limit on ${AppConfig.name}`,
  schema,
  render: ({
    email = 'panic@thedis.co',
    organizationName = 'Acme Inc.',
    organizationPlan = 'Pro',
  }) => {
    return (
      <ReactEmail.Html>
        <ReactEmail.Head />
        <ReactEmail.Preview>
          Your organization {organizationName} has reached the usage limit for
          the {String.capitalize(organizationPlan)} plan. Some features may be
          temporarily disabled.
        </ReactEmail.Preview>
        <ReactEmail.Tailwind>
          <ReactEmail.Body className="mx-auto my-auto bg-white font-sans">
            <ReactEmail.Container className="mx-auto my-10 max-w-[500px] rounded-md border border-solid border-gray-200 px-10 py-5">
              <ReactEmail.Section className="mt-8">
                <Logo />
              </ReactEmail.Section>
              <ReactEmail.Heading className="mx-0 my-7 p-0 text-left text-xl font-semibold text-black">
                Usage Limit Reached
              </ReactEmail.Heading>
              <ReactEmail.Text className="text-sm leading-6 text-black">
                Your {AppConfig.name} organization,{' '}
                <strong>{organizationName}</strong>, has exceeded the{' '}
                <strong>{String.capitalize(organizationPlan)} Plan</strong>{' '}
                limit in your current billing cycle.
              </ReactEmail.Text>
              <ReactEmail.Text className="text-sm leading-6 text-black">
                Now, you will have some features disabled until your next cycle.
                However, you can upgrade your plan to get back to work normally.
              </ReactEmail.Text>
              <ReactEmail.Section className="my-8">
                <Button href={Url.get('/app/settings/organization/billing')}>
                  Upgrade my plan
                </Button>
              </ReactEmail.Section>
              <ReactEmail.Text className="text-sm leading-6 text-black">
                Feel free to ignore this email if you don&apos;t plan on
                upgrading, or reply to let us know if you have any questions!
              </ReactEmail.Text>
              <Footer email={email} />
            </ReactEmail.Container>
          </ReactEmail.Body>
        </ReactEmail.Tailwind>
      </ReactEmail.Html>
    )
  },
})

/**
 * Renders the quota exceeded email template.
 * @param {object} props
 * @param {string} props.email - User's email address
 * @param {string} props.organizationName - Name of the organization
 * @param {string} props.organizationPlan - Current subscription plan name
 * @returns {JSX.Element} Rendered email template
 */
export default quotaExceededEmailTemplate.render
