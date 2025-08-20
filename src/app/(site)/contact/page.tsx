import { Metadata } from 'next'
import { generateMetadata, getPageMetadata } from '@/utils/metadata.utils'
import { ContactSection } from './(components)/contact-section'

export const metadata: Metadata = generateMetadata(getPageMetadata('contact'))

export default function Page() {
  return <ContactSection />
}
