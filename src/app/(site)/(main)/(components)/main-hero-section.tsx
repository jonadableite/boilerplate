'use client'

import { Link } from 'next-view-transitions'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { ArrowUpRightIcon } from 'lucide-react'

export function MainHeroSection() {
  return (
    <main className="pt-32 pb-16 relative">
      <section className="overflow-hidden">
        <div className="relative mx-auto max-w-screen-md mb-16">
          <div className="relative z-10 mx-auto max-w-screen-md flex flex-col items-center text-center">
            <h1 className="text-balance text-5xl font-normal max-w-[90%] mb-4">
              The easiest way to launch your SaaS product
            </h1>
            <p className="mb-8 text-lg text-muted-foreground max-w-[60%]">
              Build, launch and scale your SaaS business with our complete
              starter kit
            </p>

            <div className="flex items-center gap-4">
              <Button variant="default" className="rounded-full" asChild>
                <Link href="/auth">
                  <span className="btn-label">Get Started</span>
                  <ArrowUpRightIcon className="w-6 h-6 ml-2" />
                </Link>
              </Button>
              <Button variant="link" className="rounded-full" asChild>
                <Link href="/contact">
                  <span className="btn-label">Schedule demo</span>
                  <ArrowUpRightIcon className="w-6 h-6 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-screen-md">
          <div className="shadow-md">
            <Image
              className="rounded-(--radius) z-1 relative w-full rounded-md border dark:hidden"
              src="/screenshots/screenshot-01-light.png"
              alt="tailus ui hero section"
              width={2880}
              height={2074}
            />
            <Image
              className="rounded-(--radius) z-1 relative hidden rounded-md border dark:block"
              src="/screenshots/screenshot-01-dark.jpeg"
              alt="tailus ui hero section"
              width={2880}
              height={2074}
            />
          </div>
        </div>
      </section>
    </main>
  )
}
