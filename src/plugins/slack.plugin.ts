import { PluginManager } from '@/@saas-boilerplate/providers/plugin-manager/provider'
import { tryCatch } from '@/@saas-boilerplate/utils'
import { delay } from '@/@saas-boilerplate/utils/delay'
import { z } from 'zod'

export const slack = PluginManager.plugin({
  slug: 'slack',
  name: 'Slack',
  schema: z.object({
    webhook: z
      .string()
      .describe(
        'Ex: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX',
      ),
  }),
  metadata: {
    verified: true,
    published: true,
    logo: 'https://a.slack-edge.com/80588/img/icons/app-256.png',
    description:
      'Integrate Slack to centralize your notifications, streamline team communication, and automate alerts directly into your workspace channels.',
    category: 'notifications',
    developer: 'Slack',
    screenshots: [],
    website: 'https://slack.com/',
    links: {
      install: 'https://slack.com/',
      guide: 'https://api.slack.com/start',
    },
  },
  actions: {
    send: {
      name: 'Send',
      schema: z.object({
        message: z.string(),
      }),
      handler: async ({ input = {} }) => {
        const result = await tryCatch(delay(2000))

        // Here you would implement the logic to send a message to Slack
        console.log(`[Slack] Sending message: ${input.message}`)
        return result
      },
    },
  },
})
