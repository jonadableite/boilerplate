import { Igniter } from '@igniter-js/core'
import type { IgniterAppContext } from './igniter.context'

/**
 * @description Initialize the Igniter Router
 * @see https://igniter.felipebarcelospro.github.io/docs/getting-started/installation
 */
export const igniter = Igniter.context<IgniterAppContext>().create()
