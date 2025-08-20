import * as ReactEmail from '@react-email/components'

import { AppConfig } from '@/boilerplate.config'
import { Footer } from './components/footer'
import { z } from 'zod'
import { MailProvider } from '@/@saas-boilerplate/providers/mail'
import { Logo } from '@/components/ui/logo'

/**
 * Schema definition for the plan downgrade email template
 */
const schema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  previousPlan: z.string(),
  newPlan: z.string(),
  organization: z.string(),
})

/**
 * Email template for when a user downgrades their subscription plan
 * @template {typeof schema}
 * @param {object} props Template properties
 * @param {string} [props.name] - User's name (optional)
 * @param {string} props.email - User's email address
 * @param {string} props.previousPlan - Name of the previous subscription plan
 * @param {string} props.newPlan - Name of the new subscription plan
 * @param {string} props.organization - Team name
 * @returns {JSX.Element} Rendered email template
 */
export const downgradeEmailTemplate = MailProvider.template({
  subject: `Your Subscription Plan Was Changed on ${AppConfig.name}`,
  schema,
  render: ({
    name = 'John Smith',
    email = 'client@company.com',
    previousPlan = 'Pro',
    newPlan = 'Basic',
    organization = 'Sales',
  }) => {
    return (
      <ReactEmail.Html>
        <ReactEmail.Head />
        <ReactEmail.Preview>
          Your {AppConfig.name} plan for {organization} was changed from{' '}
          {previousPlan} to {newPlan}.
        </ReactEmail.Preview>
        <ReactEmail.Tailwind>
          <ReactEmail.Body className="mx-auto my-auto bg-white font-sans">
            <ReactEmail.Container className="mx-auto my-10 max-w-[500px] rounded-md border border-solid border-gray-200 px-10 py-5">
              <ReactEmail.Section className="mt-8">
                <Logo />
              </ReactEmail.Section>
              <ReactEmail.Heading className="mx-0 my-7 p-0 text-left text-xl font-semibold text-black">
                Subscription Plan Changed
              </ReactEmail.Heading>
              <ReactEmail.Text className="text-sm leading-6 text-black">
                Hello{name && ` ${name}`}!
              </ReactEmail.Text>
              <ReactEmail.Text className="text-sm leading-6 text-black">
                I&apos;m {AppConfig.creator.name}, founder of {AppConfig.name}.
                I noticed that your {organization}&apos;s plan has been changed
                from {previousPlan} to {newPlan}. We want to ensure this
                transition is smooth and that you continue to get the most value
                from our services.
              </ReactEmail.Text>
              <ReactEmail.Text className="text-sm leading-6 text-black">
                If you have any concerns or questions about this change, please
                don&apos;t hesitate to reach out. We&apos;re here to support you
                every step of the way.
              </ReactEmail.Text>
              <ReactEmail.Text className="text-sm font-light leading-6 text-zync-600">
                <u>{AppConfig.creator.name}</u> from{' '}
                <strong>{AppConfig.name}</strong>
              </ReactEmail.Text>
              <Footer email={email} marketing />
            </ReactEmail.Container>
          </ReactEmail.Body>
        </ReactEmail.Tailwind>
      </ReactEmail.Html>
    )
  },
})

/**
 * Renders the plan downgrade email template.
 * @param {object} props
 * @param {string} [props.name] - User's name (optional)
 * @param {string} props.email - User's email address
 * @param {string} props.previousPlan - Name of the previous subscription plan
 * @param {string} props.newPlan - Name of the new subscription plan
 * @param {string} props.organization - Team name
 * @returns {JSX.Element} Rendered email template
 */
export default downgradeEmailTemplate.render
