import { prismaAdapter } from '@/@saas-boilerplate/providers/payment/databases/prisma'
import { stripeAdapter } from '@/@saas-boilerplate/providers/payment/providers/stripe.adapter'
import { AppConfig } from '@/boilerplate.config'
import { prisma } from './prisma'
import { PaymentProvider } from '@/@saas-boilerplate/providers/payment'

const { keys, paths, subscription } = AppConfig.providers.billing

// Check if we're in build time and Stripe keys are missing
const isBuilding = process.env.NODE_ENV === 'production' && !keys.secret
const isMissingStripeConfig = !keys.secret || !keys.publishable || !keys.webhook

// Create a mock adapter for build time when Stripe config is missing
const createMockAdapter = () => ({
  createCustomer: async () => ({ id: 'mock', providerId: 'mock', organizationId: 'mock', name: 'mock', email: 'mock' }),
  updateCustomer: async () => ({ id: 'mock', providerId: 'mock', organizationId: 'mock', name: 'mock', email: 'mock' }),
  deleteCustomer: async () => {},
  findCustomerByReferenceId: async () => null,
  createPlan: async () => ({ planId: 'mock' }),
  updatePlan: async () => {},
  archivePlan: async () => {},
  findPlanBySlug: async () => null,
  createPrice: async () => 'mock',
  updatePrice: async () => {},
  archivePrice: async () => {},
  findPricesByPlanId: async () => [],
  createSubscription: async () => 'mock',
  updateSubscription: async () => {},
  cancelSubscription: async () => {},
  createBillingPortal: async () => 'mock',
  createCheckoutSession: async () => 'mock',
  handle: async () => null,
})

export const payment = PaymentProvider.initialize({
  database: prismaAdapter(prisma),
  adapter: (isBuilding || isMissingStripeConfig) ? createMockAdapter() : stripeAdapter(keys),
  paths: {
    checkoutCancelUrl: paths.checkoutCancelUrl,
    checkoutSuccessUrl: paths.checkoutSuccessUrl,
    portalReturnUrl: paths.portalReturnUrl,
    endSubscriptionUrl: paths.endSubscriptionUrl,
  },
  subscriptions: {
    enabled: subscription.enabled,
    trial: {
      enabled: subscription.trial.enabled,
      duration: subscription.trial.duration,
    },
    plans: {
      default: subscription.plans.default,
      options: subscription.plans.options,
    },
  },
})
