import * as ReactEmail from '@react-email/components'
import { z } from 'zod'
import { AppConfig } from '@/boilerplate.config'
import { MailProvider } from '@/@saas-boilerplate/providers/mail'
import { Footer } from './components/footer'
import { Logo } from '@/components/ui/logo'

/**
 * Schema definition for the activity notification email template
 */
const schema = z.object({
  name: z.string().optional(), // Recipient name (optional)
  email: z.string().email(), // Recipient email
  details: z.string(), // Activity details
  organization: z.string(), // Workspace context
  ctaLabel: z.string().optional(), // CTA Button label (optional)
  ctaUrl: z.string().optional(), // CTA Button URL (optional)
})

/**
 * Email template for notifying users about account activity.
 * @template {typeof schema}
 * @param {object} props Template properties
 * @param {string} [props.name] - User's display name (optional)
 * @param {string} props.email - User's email address
 * @param {string} props.details - Activity details
 * @param {string} props.organization - Workspace context
 * @param {string} [props.ctaLabel] - Optional CTA button text
 * @param {string} [props.ctaUrl] - Optional CTA button URL
 * @returns {JSX.Element} Rendered email template
 */
export const activityNotificationEmailTemplate = MailProvider.template({
  subject: `Account Activity Alert from ${AppConfig.name}`,
  schema,
  render: ({
    name = 'John Doe',
    email = 'usuario@exemplo.com',
    details = 'A new login was detected on your account from an unknown device.',
    organization = 'Demo Workspace',
    ctaLabel,
    ctaUrl,
  }) => {
    return (
      <ReactEmail.Html>
        <ReactEmail.Head>
          <style>
            {`
              @media (prefers-color-scheme: dark) {
                .invert-on-dark { filter: invert(1); }
              }
            `}
          </style>
        </ReactEmail.Head>
        <ReactEmail.Preview>
          We noticed recent activity on your {AppConfig.name} account. Please
          review the notification details.
        </ReactEmail.Preview>
        <ReactEmail.Tailwind>
          <ReactEmail.Body className="mx-auto my-auto bg-white font-sans">
            <ReactEmail.Container className="mx-auto my-10 max-w-[500px] rounded-md border border-solid border-gray-200 px-10 py-5">
              <ReactEmail.Section className="mt-8">
                <Logo />
              </ReactEmail.Section>
              <ReactEmail.Heading className="mx-0 my-7 p-0 text-left text-xl font-semibold text-black">
                Notification Alert{' '}
                {organization && (
                  <span className="opacity-60">in {organization}</span>
                )}
              </ReactEmail.Heading>
              <ReactEmail.Text className="text-sm leading-6 text-black">
                Hello{name ? `, ${name}` : ''},
              </ReactEmail.Text>
              <ReactEmail.Text className="text-sm leading-6 text-black">
                {details}
              </ReactEmail.Text>
              <ReactEmail.Text className="text-sm leading-6 text-black">
                If you do not recognize this activity, please contact our
                support team immediately.
              </ReactEmail.Text>
              {!!ctaLabel && !!ctaUrl && (
                <ReactEmail.Section className="my-6">
                  <ReactEmail.Link
                    className="rounded bg-blue-600 px-6 py-3 text-center text-[14px] font-semibold text-white no-underline hover:bg-blue-700 transition-colors"
                    href={ctaUrl}
                  >
                    {ctaLabel}
                  </ReactEmail.Link>
                </ReactEmail.Section>
              )}
              <Footer email={email} />
            </ReactEmail.Container>
          </ReactEmail.Body>
        </ReactEmail.Tailwind>
      </ReactEmail.Html>
    )
  },
})

/**
 * Renders the activity notification email template for React Email Editor
 * @param {object} props See schema
 * @returns {JSX.Element} Rendered email template
 */
export default activityNotificationEmailTemplate.render
