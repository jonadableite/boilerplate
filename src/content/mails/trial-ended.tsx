import * as ReactEmail from '@react-email/components'
import { z } from 'zod'
import { AppConfig } from '@/boilerplate.config'
import { MailProvider } from '@/@saas-boilerplate/providers/mail'
import { Footer } from './components/footer'
import { Logo } from '@/components/ui/logo'
import { Button } from './components/button'

/**
 * Schema definition for the trial ended email template
 */
const schema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  organization: z.string(),
})

/**
 * Email template for when a user's trial ends
 * @template {typeof schema}
 * @param {object} props Template properties
 * @param {string} props.email - User's email address
 * @param {string} [props.name] - User's name (optional)
 * @param {string} props.organization - Workspace or organization name
 * @returns {JSX.Element} Rendered email template
 */
export const trialEndedEmailTemplate = MailProvider.template({
  subject: `Your Free Trial on ${AppConfig.name} Has Ended`,
  schema,
  render: ({
    email = 'hello@example.com',
    name = 'Jane Doe',
    organization = 'Acme Inc.',
  }) => {
    return (
      <ReactEmail.Html>
        <ReactEmail.Head />
        <ReactEmail.Preview>
          The free trial for your organization {organization} has ended on{' '}
          {AppConfig.name}. Choose a plan to keep enjoying premium features.
        </ReactEmail.Preview>
        <ReactEmail.Tailwind>
          <ReactEmail.Body className="mx-auto my-auto bg-white font-sans">
            <ReactEmail.Container className="mx-auto my-10 max-w-[500px] rounded-md border border-solid border-gray-200 px-10 py-5">
              <ReactEmail.Section className="mt-8">
                <Logo />
              </ReactEmail.Section>
              <ReactEmail.Heading className="mx-0 my-7 p-0 text-left text-xl font-semibold text-black">
                Trial Ended
              </ReactEmail.Heading>
              <ReactEmail.Text className="text-sm leading-6 text-black">
                Hi{name ? `, ${name}` : ''}.
              </ReactEmail.Text>
              <ReactEmail.Text className="text-sm leading-6 text-black">
                The free trial for your organization{' '}
                <strong>{organization}</strong> has ended. We hope you enjoyed
                exploring {AppConfig.name} and its premium features!
              </ReactEmail.Text>
              <ReactEmail.Text className="text-sm leading-6 text-black">
                To keep enjoying uninterrupted access to all features, please
                choose a plan that best fits your needs.
              </ReactEmail.Text>
              <ReactEmail.Section className="my-8">
                <Button href="/app/billing">View plans & subscribe</Button>
              </ReactEmail.Section>
              <ReactEmail.Text className="text-sm leading-6 text-black">
                Have questions or need help? Just reply to this email and our
                team will assist you.
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
 * Renders the trial ended email template.
 * @param {object} props
 * @param {string} props.email - User's email address
 * @param {string} [props.name] - User's name (optional)
 * @param {string} props.organization - Workspace or organization name
 * @returns {JSX.Element} Rendered email template
 */
export default trialEndedEmailTemplate.render
