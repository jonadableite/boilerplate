import { AppConfig } from '@/boilerplate.config'

export const SITE_FAQ_ITEMS = [
  {
    question: `How does the ${AppConfig.name} work?`,
    answer: `Our ${AppConfig.name} provides a complete foundation for your project with pre-built components, authentication, subscription management, and a fully functional admin dashboard. Simply clone the repository, configure your environment variables, and start building your unique features on top of our stable foundation.`,
  },
  {
    question: `Do I need technical experience to use ${AppConfig.name}?`,
    answer: `While some development experience is helpful, our ${AppConfig.name} is designed to be user-friendly with comprehensive documentation. We have step-by-step guides to help you get started, even if you're not an expert developer.`,
  },
  {
    question: 'What technologies are included in the stack?',
    answer:
      'The boilerplate is built on Next.js with the App Router, TypeScript, Prisma ORM, NextAuth.js for authentication, Stripe for payments, Tailwind CSS with Shadcn UI components, and a range of other modern tools to create a complete SaaS foundation.',
  },
  {
    question: 'Can I customize the design and branding?',
    answer:
      'Absolutely! The boilerplate uses Tailwind CSS and Shadcn UI, making it incredibly easy to customize the design to match your brand. You can adjust colors, typography, spacing, and component styles without starting from scratch.',
  },
  {
    question: 'Can I use it for multiple projects?',
    answer:
      'Yes! Depending on your license, you can use the boilerplate for multiple projects. Our Standard license allows use on a single end product, while our Extended license supports unlimited projects.',
  },
  {
    question: 'How do I get started?',
    answer:
      "Getting started is easy! Purchase your preferred license, download the code, follow our quick start guide to configure your environment, and you'll have a working application in minutes.",
  },
  {
    question: 'How does the subscription management work?',
    answer:
      'The boilerplate includes a complete subscription system integrated with Stripe. It handles plan creation, subscription management, invoicing, payment processing, and webhooks to keep your application in sync with payment statuses.',
  },
  {
    question: 'Is technical support available?',
    answer:
      'Yes! We provide technical support for all license types, with priority support for Extended license holders. Our documentation is comprehensive, but our team is always available to help with any questions or issues.',
  },
]
