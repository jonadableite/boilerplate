import * as ReactEmail from '@react-email/components'

import { z } from 'zod'
import { Footer } from './components/footer'
import { AppConfig } from '@/boilerplate.config'
import { MailProvider } from '@/@saas-boilerplate/providers/mail'
import { Logo } from '@/components/ui/logo'

/**
 * Schema definition for the OTP code email template
 */
const schema = z.object({
  name: z.string().nullable().optional(),
  email: z.string().email(),
  otpCode: z.string(),
  expiresInMinutes: z.number().default(10),
})

/**
 * Email template for sending OTP verification codes
 * @template {typeof schema}
 * @param {object} props Template properties
 * @param {string|null} [props.name] - User's name (optional)
 * @param {string} props.email - User's email address
 * @param {string} props.otpCode - The OTP code for verification
 * @param {number} props.expiresInMinutes - Minutes until the code expires
 * @returns {JSX.Element} Rendered email template
 */
export const otpCodeEmailTemplate = MailProvider.template({
  subject: `Your Verification Code for ${AppConfig.name}`,
  schema,
  render: ({
    name = 'John Doe',
    email = 'john@example.com',
    otpCode = '123456',
    expiresInMinutes = 10,
  }) => {
    return (
      <ReactEmail.Html>
        <ReactEmail.Head />
        <ReactEmail.Preview>
          Here is your verification code for {AppConfig.name}: {otpCode}
        </ReactEmail.Preview>
        <ReactEmail.Tailwind>
          <ReactEmail.Body className="mx-auto my-auto bg-white font-sans">
            <ReactEmail.Container className="mx-auto my-10 max-w-[500px] rounded-md border border-solid border-gray-200 px-10 py-5">
              <ReactEmail.Section className="mt-8">
                <Logo />
              </ReactEmail.Section>
              <ReactEmail.Heading className="mx-0 my-7 p-0 text-left text-xl font-semibold text-black">
                Your Verification Code
              </ReactEmail.Heading>
              <ReactEmail.Text className="text-sm leading-6 text-black">
                Hello{name ? ` ${name}` : ''},
              </ReactEmail.Text>
              <ReactEmail.Text className="text-sm leading-6 text-black">
                Your verification code for {AppConfig.name} is:
              </ReactEmail.Text>
              <ReactEmail.Section className="my-8 text-center">
                <ReactEmail.Section className="rounded-md bg-gray-100 py-4">
                  <ReactEmail.Text className="m-0 text-center font-mono text-3xl font-bold tracking-widest text-black">
                    {otpCode}
                  </ReactEmail.Text>
                </ReactEmail.Section>
              </ReactEmail.Section>
              <ReactEmail.Text className="text-sm leading-6 text-black">
                This code will expire in {expiresInMinutes} minutes. If you
                didn't request this code, you can safely ignore this email.
              </ReactEmail.Text>
              <ReactEmail.Text className="text-sm leading-6 text-black">
                For security reasons, please do not share this code with anyone.
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
 * Renders the OTP code email template.
 * @param {object} props
 * @param {string|null} [props.name] - User's name (optional)
 * @param {string} props.email - User's email address
 * @param {string} props.otpCode - The OTP code for verification
 * @param {number} props.expiresInMinutes - Minutes until the code expires
 * @returns {JSX.Element} Rendered email template
 */
export default otpCodeEmailTemplate.render
