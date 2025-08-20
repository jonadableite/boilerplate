import { PluginManager } from '@/@saas-boilerplate/providers/plugin-manager/provider'
import { tryCatch } from '@/@saas-boilerplate/utils'
import { delay } from '@/@saas-boilerplate/utils/delay'
import { z } from 'zod'

export const whatsapp = PluginManager.plugin({
  slug: 'whatsapp',
  name: 'WhatsApp',
  schema: z.object({
    chatId: z.string().describe('Ex: +5511999999999'),
  }),
  metadata: {
    verified: true,
    published: true,
    logo: 'https://static.whatsapp.net/rsrc.php/v3/yP/r/rYZqPCBaG70.png',
    description:
      'Integrate your account with WhatsApp to receive notifications.',
    category: 'notifications',
    developer: 'WhatsApp',
    screenshots: [],
    website: 'https://www.whatsapp.com/',
    links: {
      install: 'https://www.whatsapp.com/',
      guide: 'https://developers.facebook.com/docs/whatsapp/',
    },
  },
  actions: {
    send: {
      name: 'Send',
      schema: z.object({
        message: z.string(),
        chatId: z.string().optional(),
      }),
      handler: async ({ input }) => {
        const result = await tryCatch(delay(2000))

        // Here you would implement the logic to send a message to WhatsApp
        console.log(`[WhatsApp] Sending message: ${input.message}`)
        return result
      },
    },
  },
})
