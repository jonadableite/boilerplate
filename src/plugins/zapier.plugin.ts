import { PluginManager } from '@/@saas-boilerplate/providers/plugin-manager/provider'
import { delay } from '@/@saas-boilerplate/utils/delay'
import { tryCatch } from '@igniter-js/core'
import { z } from 'zod'

export const zapier = PluginManager.plugin({
  slug: 'zapier',
  name: 'Zapier',
  schema: z.object({
    apiKey: z.string().describe('Ex: 1234567890abcdef1234567890abcdef'),
    workspaceId: z.string().describe('Ex: 1234567890abcdef1234567890abcdef'),
    triggerId: z.string().describe('Ex: 1234567890abcdef1234567890abcdef'),
  }),
  metadata: {
    verified: true,
    published: true,
    logo: 'https://dubassets.com/integrations/clzlmz336000fjeqynwhfv8vo_S4yz4ak', // Zapier logo
    description:
      'Automate your workflows with Zapier, connecting your apps and services to create powerful automations without coding.',
    category: 'automations',
    developer: 'Zapier',
    screenshots: [],
    website:
      'https://www.pipelinersales.com/wp-content/uploads/2018/07/zapier.jpg',
    links: {
      install: 'https://zapier.com/',
      guide: 'https://zapier.com/help/',
    },
  },
  actions: {
    sendEvent: {
      name: 'Send Event',
      schema: z.object({
        event: z.string(),
        data: z.record(z.any()),
      }),
      handler: async ({ input }) => {
        const result = await tryCatch(delay(2000))

        // Here you would implement the logic to send an event via Zapier
        console.log(`[Zapier] Sending event: ${input.event}`)
        return result
      },
    },
  },
})
