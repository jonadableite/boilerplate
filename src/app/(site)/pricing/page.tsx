import type { Metadata } from 'next/types'
import { SiteCTA } from '../(components)/site-cta'
import { SiteFaqSection } from '../(components)/site-faq-section'
import { SiteFeaturedSection } from '../(components)/site-featured-section'
import { SitePricingSection } from '../(components)/site-pricing-section'
import { generateMetadata, getPageMetadata } from '@/utils/metadata.utils'

export const metadata: Metadata = generateMetadata(getPageMetadata('pricing'))

export default function Page() {
  return (
    <div>
      <SitePricingSection />
      <SiteFeaturedSection />
      <SiteFaqSection />
      <SiteCTA />
    </div>
  )
}
