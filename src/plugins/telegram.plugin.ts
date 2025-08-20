import { PluginManager } from '@/@saas-boilerplate/providers/plugin-manager/provider'
import { tryCatch } from '@/@saas-boilerplate/utils'
import { delay } from '@/@saas-boilerplate/utils/delay'
import { z } from 'zod'

export const telegram = PluginManager.plugin({
  name: 'Telegram',
  slug: 'telegram',
  schema: z.object({
    chatId: z.string().describe('Telegram chat ID'),
    token: z.string().describe('Telegram bot token'),
  }),
  metadata: {
    verified: true,
    published: true,
    logo: 'https://telegram.org/img/t_logo.png',
    description:
      'Effortlessly link your Telegram account to send and receive instant notifications.',
    category: 'notifications',
    developer: 'Telegram',
    screenshots: [],
    website: 'https://telegram.org/',
    links: {
      install: 'https://telegram.org/',
      guide: 'https://telegram.org/faq',
    },
  },
  actions: {
    send: {
      name: 'Send',
      schema: z.object({
        message: z.string().describe('Message to send'),
        chatId: z
          .string()
          .optional()
          .describe('Chat ID to send the message to'),
      }),
      handler: async ({ config, input }) => {
        const { message, chatId } = input

        const result = await tryCatch(delay(2000))

        // Here you would implement the logic to send a message to Telegram
        console.log(`[Telegram] Sending message`, { message, chatId, config })
        return result
      },
    },
  },
})
