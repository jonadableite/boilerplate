// src/igniter.context
import { cache } from 'react'
import { auth } from './providers/auth'
import { mail } from './providers/mail'
import { plugins } from './providers/plugin-manager'
import { payment } from './providers/payment'
import { prisma } from './providers/prisma'

// Conditionally import AI services only on server-side
let AIServicesProvider: any = null
if (typeof window === 'undefined') {
  // Server-side only
  try {
    AIServicesProvider = require('./providers/ai-services').AIServicesProvider
  } catch (error) {
    console.warn('AI Services not available:', error)
  }
}

/**
 * @description Create the context of the application
 * @see https://igniter.felipebarcelospro.github.io/docs/getting-started/installation
 */
export const createIgniterAppContext = cache(() => {
  return {
    providers: {
      database: prisma,
      auth,
      mail,
      payment,
      plugins,
      ...(AIServicesProvider && { aiServices: AIServicesProvider }),
    },
  }
})

/**
 * @description The context of the application
 * @see https://igniter.felipebarcelospro.github.io/docs/getting-started/installation
 */
export type IgniterAppContext = Awaited<
  ReturnType<typeof createIgniterAppContext>
>
