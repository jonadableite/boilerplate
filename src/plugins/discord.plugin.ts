import { PluginManager } from '@/@saas-boilerplate/providers/plugin-manager/provider'
import { tryCatch } from '@/@saas-boilerplate/utils'
import { delay } from '@/@saas-boilerplate/utils/delay'
import { z } from 'zod'

export const discord = PluginManager.plugin({
  slug: 'discord',
  name: 'Discord',
  schema: z.object({
    webhookUrl: z
      .string()
      .describe('Ex: https://discord.com/api/webhooks/1234567890/abcdefg'),
  }),
  metadata: {
    verified: true,
    published: true,
    logo: 'https://logodownload.org/wp-content/uploads/2017/11/discord-logo-8-1.png',
    description:
      'Seamlessly connect your Discord server to receive real-time notifications and updates, keeping your team informed and engaged with automated alerts.',
    category: 'notifications',
    developer: 'Discord',
    screenshots: [],
    website: 'https://discord.com/',
    links: {
      install: 'https://discord.com/',
      guide: 'https://discord.com/developers/docs',
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

        // Here you would implement the logic to send a message to Discord
        console.log(`[Discord] Sending message: ${input}`)
        return result
      },
    },
  },
})
