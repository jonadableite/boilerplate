import type { Metadata } from 'next'
import { SiteCTA } from '../(components)/site-cta'
import { SiteFaqSection } from '../(components)/site-faq-section'
import { SiteFeaturedSection } from '../(components)/site-featured-section'
import { SiteLogoShowcase } from '../(components)/site-logo-showcase'
import { SiteTestimonialsSection } from '../(components)/site-testimonials-section'
import { MainHeroSection } from './(components)/main-hero-section'
import { SitePricingSection } from '../(components)/site-pricing-section'

import { generateMetadata, getPageMetadata } from '@/utils/metadata.utils'
import SiteExpandedFeaturesSection from '../(components)/site-expanded-features-section'

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = false
export const fetchCache = 'auto'
export const metadata: Metadata = generateMetadata(getPageMetadata('home'))

export default function Page() {
  return (
    <div className="space-y-0 divide-y">
      <MainHeroSection />

      <SiteLogoShowcase />
      <SiteExpandedFeaturesSection />
      <SiteFeaturedSection />
      <SitePricingSection />
      <SiteTestimonialsSection />
      <SiteFaqSection />
      <SiteCTA />
    </div>
  )
}
