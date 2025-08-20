import { payment } from '@/providers/payment'

/**
 * @description
 * Handles payment webhooks and syncs the database
 */
export const POST = async (request: Request) => {
  const event = await payment.handle(request)
  return new Response(JSON.stringify(event), { status: 200 })
}
