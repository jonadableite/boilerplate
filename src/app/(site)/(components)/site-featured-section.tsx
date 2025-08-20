import { AppConfig } from '@/boilerplate.config'
import {
  CheckCircle2Icon,
  FileChartLineIcon,
  HeartHandshakeIcon,
  MessageCircleDashedIcon,
  WrenchIcon,
} from 'lucide-react'

export function SiteFeaturedSection() {
  return (
    <div className="w-full py-16">
      <div className="container mx-auto max-w-screen-md">
        <div className="flex flex-col">
          <div className="flex gap-4 flex-col items-center text-center mb-16">
            <WrenchIcon
              className="size-10 mb-4 stroke-2 text-primary mx-auto"
              fill="currentColor"
              fillOpacity={0.15}
            />

            <h2 className="text-balance text-2xl font-semibold !leading-[1.2] tracking-tight sm:text-3xl md:text-4xl">
              Everything You Need <br /> to Launch Faster
            </h2>
            <p className="text-balance text-muted-foreground text-sm leading-6 sm:text-base sm:leading-7">
              Our {AppConfig.name} provides all the essential features so you
              can focus on building what makes your product unique
            </p>
          </div>
          <div className="grid md:grid-cols-2 bg-secondary rounded-md overflow-hidden border">
            <div className="border-r border-b h-full p-6 aspect-square lg:aspect-auto flex justify-between flex-col">
              <HeartHandshakeIcon
                className="w-8 h-8 stroke-2 text-primary"
                fill="currentColor"
                fillOpacity={0.3}
              />
              <div className="flex flex-col">
                <h3 className="mb-1">Authentication & Authorization</h3>
                <p className="text-muted-foreground max-w-xs text-base">
                  Complete user authentication system with role-based access
                  control and social logins built in.
                </p>
              </div>
            </div>
            <div className="border-b aspect-square p-6 flex justify-between flex-col">
              <MessageCircleDashedIcon
                className="w-8 h-8 stroke-2 text-primary"
                fill="currentColor"
                fillOpacity={0.3}
              />
              <div className="flex flex-col">
                <h3 className="mb-1">Subscription Management</h3>
                <p className="text-muted-foreground max-w-xs text-base">
                  Complete integration with Stripe for handling plans, payments,
                  and billing workflows.
                </p>
              </div>
            </div>
            <div className="aspect-square border-r p-6 flex justify-between flex-col">
              <FileChartLineIcon
                className="w-8 h-8 stroke-2 text-primary"
                fill="currentColor"
                fillOpacity={0.3}
              />
              <div className="flex flex-col">
                <h3 className="mb-1">Analytics Dashboard</h3>
                <p className="text-muted-foreground max-w-xs text-base">
                  Track user activity, subscriptions, and revenue with
                  beautiful, responsive charts and metrics.
                </p>
              </div>
            </div>
            <div className="h-full p-6 aspect-square lg:aspect-auto flex justify-between flex-col">
              <CheckCircle2Icon
                className="w-8 h-8 stroke-2 text-primary"
                fill="currentColor"
                fillOpacity={0.3}
              />
              <div className="flex flex-col">
                <h3 className="mb-1">API Integration</h3>
                <p className="text-muted-foreground max-w-xs text-base">
                  Well-documented API endpoints and hooks to easily connect with
                  third-party services and extend functionality.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
