import { AppConfig } from '@/boilerplate.config'
import { Metadata } from 'next'

export type GenerateMetadataProps = {
  title?: string
  description?: string
  ogImage?: string
  keywords?: string[]
  noIndex?: boolean
  path?: string
}

/**
 * Generates consistent metadata for SEO across the application
 * Uses app.config.ts data as default values and allows overriding
 */
export function generateMetadata({
  title,
  description,
  ogImage,
  keywords = [],
  noIndex = false,
  path = '',
}: GenerateMetadataProps): Metadata {
  const siteUrl = AppConfig.url
  const fullPath = `${siteUrl}${path}`
  const siteName = AppConfig.name

  // Combine app-wide keywords with page-specific ones
  const allKeywords = [...AppConfig.keywords, ...keywords]

  // Determine title format: either custom or default with site name
  const metaTitle = title ? `${title} | ${siteName}` : siteName

  // Use custom description or fall back to site default
  const metaDescription = description || AppConfig.description

  // Determine OG image path - custom or default
  const ogImageUrl = ogImage || `${siteUrl}/${AppConfig.brand.og}`

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: allKeywords,
    authors: [
      {
        name: AppConfig.creator.name,
        url: AppConfig.creator.links.twitter,
      },
    ],
    creator: AppConfig.creator.name,
    publisher: siteName,
    robots: noIndex ? 'noindex, nofollow' : 'index, follow',
    alternates: {
      canonical: fullPath,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: fullPath,
      title: metaTitle,
      description: metaDescription,
      siteName,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: metaTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [ogImageUrl],
      creator: '@' + AppConfig.creator.links.twitter.split('/').pop(),
      site: '@' + AppConfig.links.twitter.split('/').pop(),
    },
    other: {
      'og:site_name': siteName,
      'og:url': fullPath,
      'og:image:alt': metaTitle,
      'twitter:domain': new URL(siteUrl).hostname,
      'twitter:url': fullPath,
    },
  }
}

/**
 * Function to generate page-specific metadata based on route patterns
 */
export function getPageMetadata(path: string): GenerateMetadataProps {
  // Base path without params
  const basePath = path.split('/').filter(Boolean)[0] || 'home'

  // Mapping of routes to specific metadata
  const metadataMap: Record<string, GenerateMetadataProps> = {
    home: {
      title: 'Start Building Your SaaS Today',
      description: `${AppConfig.name} - ${AppConfig.description}. A modern, type-safe SaaS boilerplate to accelerate your project.`,
      path: '/',
      keywords: ['SaaS Platform', 'Micro-SaaS', 'Startup', 'Business Solution'],
    },
    pricing: {
      title: 'Pricing Plans',
      description: `Flexible pricing plans for your SaaS needs. Find the right plan for your business with ${AppConfig.name}.`,
      path: '/pricing',
      keywords: [
        'SaaS Pricing',
        'Subscription Plans',
        'Business Plans',
        'Affordable SaaS',
      ],
    },
    blog: {
      title: 'Blog',
      description: `Latest insights, tutorials, and updates from the ${AppConfig.name} team to help grow your SaaS business.`,
      path: '/blog',
      keywords: [
        'SaaS Blog',
        'SaaS Tips',
        'Business Growth',
        'SaaS Development',
      ],
    },
    docs: {
      title: 'Documentation',
      description: `Comprehensive documentation for ${AppConfig.name}. Learn how to build, deploy, and scale your SaaS application.`,
      path: '/docs',
      keywords: [
        'SaaS Documentation',
        'Developer Guides',
        'SaaS Tutorials',
        'Technical Docs',
      ],
    },
    help: {
      title: 'Help Center',
      description: `Get help with ${AppConfig.name}. Find answers to common questions and get support for your SaaS application.`,
      path: '/help',
      keywords: ['SaaS Help', 'Customer Support', 'Troubleshooting', 'FAQs'],
    },
    contact: {
      title: 'Contact Us',
      description: `Get in touch with the ${AppConfig.name} team. We're here to help you succeed with your SaaS application.`,
      path: '/contact',
      keywords: [
        'SaaS Contact',
        'Customer Service',
        'Support Team',
        'Get in Touch',
      ],
    },
    updates: {
      title: 'Updates & Changelog',
      description: `Stay up to date with the latest features, improvements, and fixes for ${AppConfig.name}.`,
      path: '/updates',
      keywords: [
        'SaaS Updates',
        'New Features',
        'Product Updates',
        'Release Notes',
      ],
    },
  }

  return (
    metadataMap[basePath] || {
      title: 'SaaS Boilerplate',
      description: AppConfig.description,
      path,
    }
  )
}
