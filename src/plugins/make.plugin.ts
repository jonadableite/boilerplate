import { PluginManager } from '@/@saas-boilerplate/providers/plugin-manager/provider'
import { tryCatch } from '@/@saas-boilerplate/utils'
import { delay } from '@/@saas-boilerplate/utils/delay'
import { z } from 'zod'

export const make = PluginManager.plugin({
  slug: 'make',
  name: 'Make',
  schema: z.object({
    apiKey: z.string().describe('Ex: 1234567890abcdef1234567890abcdef'),
    workflowId: z.string().describe('Ex: 1234567890abcdef1234567890abcdef'),
    environment: z
      .enum(['production', 'staging', 'development'])
      .describe('Ex: production'),
  }),
  metadata: {
    verified: true,
    published: true,
    logo: 'https://www.make.com/en/favicon.ico', // Example logo
    description:
      'Integrate your SaaS application with Make to streamline processes.',
    category: 'automations',
    developer: 'Make',
    screenshots: [],
    website: 'https://www.make.com/',
    links: {
      install: 'https://www.make.com/',
      guide: 'https://www.make.com/en/help',
    },
  },
  actions: {
    send: {
      name: 'Send',
      schema: z.object({
        message: z.string(),
      }),
      handler: async ({ input }) => {
        const result = await tryCatch(delay(2000))

        // Here you would implement the logic to send a message via Make
        console.log(`[Make] Sending message: ${input.message}`)
        return result
      },
    },
  },
})
