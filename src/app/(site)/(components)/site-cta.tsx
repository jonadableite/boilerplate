import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import { MoveRight } from 'lucide-react'
import { Link } from 'next-view-transitions'

export const SiteCTA = ({ className }: { className?: string }) => (
  <div className={cn('w-full py-16', className)}>
    <div className="container max-w-screen-md mx-auto grid grid-cols-[1fr_auto] gap-8 items-center">
      <h3 className="text-balance text-xl md:text-2xl font-semibold !leading-[1.2] tracking-tight">
        Ready to build your
        <br />
        custom SaaS platform?
      </h3>
      <div className="flex items-end h-full">
        <Button className="gap-4" asChild>
          <Link href="/auth">
            Get Started <MoveRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  </div>
)
