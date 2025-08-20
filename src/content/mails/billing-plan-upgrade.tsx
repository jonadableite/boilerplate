import * as ReactEmail from '@react-email/components'

import { z } from 'zod'
import { Footer } from './components/footer'
import { AppConfig } from '@/boilerplate.config'
import { MailProvider } from '@/@saas-boilerplate/providers/mail'
import { Logo } from '@/components/ui/logo'

/**
 * Schema definition for the plan upgrade email template
 */
const schema = z.object({
  name: z.string().nullable().optional(),
  email: z.string().email(),
  plan: z.string(),
  organization: z.string(),
})

/**
 * Email template for when a user upgrades their subscription plan
 * @template {typeof schema}
 * @param {object} props Template properties
 * @param {string|null} [props.name] - User's name (optional)
 * @param {string} props.email - User's email address
 * @param {string} props.plan - Name of the subscription plan upgraded to
 * @param {string} props.organization - Team name
 * @returns {JSX.Element} Rendered email template
 */
export const planUpgradeEmailTemplate = MailProvider.template({
  subject: `Thank You for Upgrading Your Plan on ${AppConfig.name}!`,
  schema,
  render: ({
    name = 'Brendon Urie',
    email = 'panic@thedis.co',
    plan = 'Pro',
    organization = 'Acme Inc.',
  }) => {
    return (
      <ReactEmail.Html>
        <ReactEmail.Head />
        <ReactEmail.Preview>
          Your {AppConfig.name} plan upgrade was successful. Thank you for
          supporting us!
        </ReactEmail.Preview>
        <ReactEmail.Tailwind>
          <ReactEmail.Body className="mx-auto my-auto bg-white font-sans">
            <ReactEmail.Container className="mx-auto my-10 max-w-[500px] rounded-md border border-solid border-gray-200 px-10 py-5">
              <ReactEmail.Section className="mt-8">
                <Logo />
              </ReactEmail.Section>
              <ReactEmail.Heading className="mx-0 my-7 p-0 text-left text-xl font-semibold text-black">
                Plan Upgrade Confirmed
              </ReactEmail.Heading>
              <ReactEmail.Text className="text-sm leading-6 text-black">
                Hey{name && ` ${name}`}!
              </ReactEmail.Text>
              <ReactEmail.Text className="text-sm leading-6 text-black">
                My name is {AppConfig.creator.name}, and I&apos;m the founder of{' '}
                {AppConfig.name}. I wanted to personally reach out to thank you
                for upgrading to {AppConfig.name} {plan} on "{organization}"
                organization!
              </ReactEmail.Text>

              <ReactEmail.Text className="text-sm leading-6 text-black">
                Let me know if you have any questions or feedback. I&apos;m
                always happy to help!
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
 * Renders the plan upgrade email template.
 * @param {object} props
 * @param {string|null} [props.name] - User's name (optional)
 * @param {string} props.email - User's email address
 * @param {string} props.plan - Name of the subscription plan upgraded to
 * @param {string} props.organization - Team name
 * @returns {JSX.Element} Rendered email template
 */
export default planUpgradeEmailTemplate.render
