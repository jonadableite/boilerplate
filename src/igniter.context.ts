// src/igniter.context
import { cache } from 'react'
import { auth } from './providers/auth'
import { mail } from './providers/mail'
import { plugins } from './providers/plugin-manager'
import { payment } from './providers/payment'
import { prisma } from './providers/prisma'

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
