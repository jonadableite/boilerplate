import { Link } from 'next-view-transitions'

import { Button } from '@/components/ui/button'
import { ArrowLeftIcon, LifeBuoyIcon } from 'lucide-react'
import { PropsWithChildren } from 'react'
import { Logo } from '@/components/ui/logo'
import { api } from '@/igniter.client'
import { redirect } from 'next/navigation'
import { AppConfig } from '@/boilerplate.config'
import { Vortex } from '@/components/ui/vortex'
import { AuroraBackground } from '@/components/ui/aurora-background'
import { WelcomeTextSection } from '@/components/ui/welcome-text-section'

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = false
export const fetchCache = 'auto'

export default async function Layout({ children }: PropsWithChildren) {
  // Business Rule: Get the current session
  const session = await api.auth.getSession.query()

  // Business Rule: If the session is valid, redirect to the app
  if (!session.error) redirect('/app')

  return (
    <div className="relative min-h-screen flex overflow-hidden">
      {/* Left Half - Vortex Background - Hidden on mobile, visible on lg+ */}
      <div className="hidden lg:flex lg:flex-1 relative min-h-screen">
        <div className="absolute inset-0 z-0 w-full h-full">
          <Vortex
            rangeY={800}
            particleCount={500}
            backgroundColor="black"
            className="flex items-center flex-col justify-center px-2 md:px-10 py-4 w-full h-full"
          />
        </div>

        {/* Welcome Text Section */}
        <WelcomeTextSection />
      </div>

      {/* Right Half - Aurora Background with Form - Full width on mobile, half on lg+ */}
      <div className="w-full lg:flex-1 relative min-h-screen max-w-none">
        <AuroraBackground
          className="w-full h-full min-h-screen flex items-center justify-center relative"
          showRadialGradient={true}
        >
          {/* Content Container with Responsive Spacing */}
          <div className="relative z-10 w-full h-full flex flex-col">
            {/* Header positioned at the top */}
            <header className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 transition-all duration-300">
              <div className="flex items-center gap-2 sm:gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-white hover:bg-white/10 text-xs sm:text-sm"
                >
                  <Link href="/">
                    <ArrowLeftIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">
                      Back to {AppConfig.name}
                    </span>
                    <span className="sm:hidden">Back</span>
                  </Link>
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-white hover:bg-white/10 text-xs sm:text-sm"
              >
                <Link href="/support">
                  <LifeBuoyIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Support</span>
                </Link>
              </Button>
            </header>

            {/* Main Content with Responsive Lateral Spacing */}
            <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
              <div
                className="w-full max-w-xs sm:max-w-sm md:max-w-md space-y-4 sm:space-y-6 lg:space-y-8 bg-white/10 backdrop-blur-md rounded-lg p-4 sm:p-6 lg:p-8 border border-white/20 shadow-2xl transition-all duration-300"
                style={{
                  marginLeft: 'clamp(10px, 8vw, 290px)',
                  marginRight: 'clamp(10px, 8vw, 290px)',
                }}
              >
                <div className="text-center">
                  <Logo className="mx-auto h-8 sm:h-10 lg:h-12 w-auto" />
                </div>
                {children}
              </div>
            </main>

            {/* Footer with Responsive Bottom Spacing */}
            <footer
              className="text-center text-xs sm:text-sm text-white/70 px-4 sm:px-6 lg:px-8 py-4 transition-all duration-300"
              style={{
                marginBottom: 'clamp(30px, 8vh, 180px)',
              }}
            >
              © {new Date().getFullYear()} {AppConfig.name}. All rights
              reserved.
            </footer>
          </div>
        </AuroraBackground>
      </div>
    </div>
  )
}
