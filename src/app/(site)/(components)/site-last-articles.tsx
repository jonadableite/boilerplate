import { AppConfig } from '@/boilerplate.config'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import { MoveRight } from 'lucide-react'

export const SiteLastArticles = ({ className }: { className?: string }) => (
  <div className={cn('w-full py-16', className)}>
    <div className="container max-w-screen-md mx-auto flex flex-col gap-14">
      <div className="flex w-full flex-col sm:flex-row sm:justify-between sm:items-center gap-8">
        <h4 className="text-3xl md:text-5xl tracking-tighter max-w-xl font-regular">
          Latest articles
        </h4>
        <Button className="gap-4">
          View all articles <MoveRight className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="flex flex-col gap-2 hover:opacity-75 cursor-pointer">
          <div className="bg-muted rounded-md aspect-video mb-4"></div>
          <h3 className="text-xl tracking-tight">
            Getting Started with {AppConfig.name}
          </h3>
          <p className="text-muted-foreground text-base">
            Learn how to set up your environment and deploy your first
            application in minutes.
          </p>
        </div>
        <div className="flex flex-col gap-2 hover:opacity-75 cursor-pointer">
          <div className="bg-muted rounded-md aspect-video mb-4"></div>
          <h3 className="text-xl tracking-tight">Customizing Your Dashboard</h3>
          <p className="text-muted-foreground text-base">
            Discover how to tailor the admin dashboard to match your brand and
            specific needs.
          </p>
        </div>
        <div className="flex flex-col gap-2 hover:opacity-75 cursor-pointer">
          <div className="bg-muted rounded-md aspect-video mb-4"></div>
          <h3 className="text-xl tracking-tight">
            Integrating Payment Systems
          </h3>
          <p className="text-muted-foreground text-base">
            A complete guide to configuring Stripe and managing subscription
            plans effectively.
          </p>
        </div>
        <div className="flex flex-col gap-2 hover:opacity-75 cursor-pointer">
          <div className="bg-muted rounded-md aspect-video mb-4"></div>
          <h3 className="text-xl tracking-tight">
            User Authentication Options
          </h3>
          <p className="text-muted-foreground text-base">
            Explore different authentication methods and security best practices
            for your SaaS.
          </p>
        </div>
      </div>
    </div>
  </div>
)
