import { PluginManager } from '@/@saas-boilerplate/providers/plugin-manager/provider'
import { tryCatch } from '@/@saas-boilerplate/utils'
import { delay } from '@/@saas-boilerplate/utils/delay'
import { z } from 'zod'

export const mailchimp = PluginManager.plugin({
  slug: 'mailchimp',
  name: 'Mailchimp',
  schema: z.object({
    apiKey: z.string().describe('Ex: 1234567890abcdef1234567890abcdef-us1'),
    listId: z.string().describe('Ex: 1234567890abcdef1234567890abcdef'),
    serverPrefix: z.string().describe('Ex: us1'),
  }),
  metadata: {
    verified: true,
    published: true,
    logo: 'https://static-00.iconduck.com/assets.00/mailchimp-icon-2048x2048-isefig92.png',
    description:
      'Integrate your account with Mailchimp to manage your email campaigns.',
    category: 'email-marketing',
    developer: 'Mailchimp',
    screenshots: [],
    website: 'https://mailchimp.com/',
    links: {
      install: 'https://mailchimp.com/',
      guide: 'https://mailchimp.com/developer/',
    },
  },
  actions: {
    send: {
      name: 'Send',
      schema: z.object({
        html: z.string(),
        text: z.string(),
        subject: z.string(),
      }),
      handler: async ({ input }) => {
        const result = await tryCatch(delay(2000))

        // Here you would implement the logic to send an email via Mailchimp
        console.log(`[Mailchimp] Sending email`, {
          html: input.html,
          text: input.text,
          subject: input.subject,
        })
        return result
      },
    },
  },
})
