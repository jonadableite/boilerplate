'use client'

import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'
import { cn } from '@/utils/cn'
import { useEffect, useState } from 'react'

export const SiteLogoShowcase = ({ className }: { className?: string }) => {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!api) {
      return
    }

    setTimeout(() => {
      if (api.selectedScrollSnap() + 1 === api.scrollSnapList().length) {
        setCurrent(0)
        api.scrollTo(0)
      } else {
        api.scrollNext()
        setCurrent(current + 1)
      }
    }, 1000)
  }, [api, current])

  return (
    <div className={cn('w-full py-16', className)}>
      <div className="container max-w-screen-md mx-auto sm:px-4 md:px-0">
        <div className="gap-10 items-center">
          <Carousel setApi={setApi} className="w-full">
            <CarouselContent>
              {[
                'https://cdn.prod.website-files.com/63c3f1995d4c3581bbc944b5/63c418af3b2b766cebaba02d_client-logo-01.svg',
                'https://cdn.prod.website-files.com/63c3f1995d4c3581bbc944b5/63c418ce6a0062cf2d279e35_client-logo-02.svg',
                'https://cdn.prod.website-files.com/63c3f1995d4c3581bbc944b5/63c418ce9f1b45e141bf28b5_client-logo-03.svg',
                'https://cdn.prod.website-files.com/63c3f1995d4c3581bbc944b5/63c418ce2c404b364300ba31_client-logo-04.svg',
                'https://cdn.prod.website-files.com/63c3f1995d4c3581bbc944b5/63c418cea9dabe252e43b0c0_client-logo-07.svg',
                'https://cdn.prod.website-files.com/63c3f1995d4c3581bbc944b5/63c418cea9dabef95143b0c1_client-logo-06.svg',
              ].map((image, index) => (
                <CarouselItem className="basis-1/4 lg:basis-1/6" key={index}>
                  <img
                    src={image}
                    alt={`Client ${index + 1}`}
                    className="w-full h-5 object-contain dark:invert invert-0"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </div>
  )
}
