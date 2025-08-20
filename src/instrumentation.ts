import { tryCatch } from '@igniter-js/core'
import { payment } from './providers/payment'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await tryCatch(payment.sync())
  }
}
