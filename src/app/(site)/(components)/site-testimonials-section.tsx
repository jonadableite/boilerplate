'use client'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import { cn } from '@/utils/cn'
import { MessageCircleHeart } from 'lucide-react'

const testimonials = [
  {
    title: 'Amazing Results',
    content:
      "Since launching with this boilerplate, we've been able to focus on building our product instead of infrastructure. It saved us months of development time.",
    author: 'Sarah Johnson',
    role: 'Startup Founder',
    avatar: 'SJ',
  },
  {
    title: 'Incredibly Easy',
    content:
      'I was able to launch my SaaS in just a few days. The authentication, subscription management, and admin panel are extremely well designed.',
    author: 'Michael Chen',
    role: 'Solo Entrepreneur',
    avatar: 'MC',
  },
  {
    title: 'Exceptional Support',
    content:
      "The documentation is comprehensive, but whenever I needed help, the team was incredibly responsive. Best developer experience I've had.",
    author: 'Emily Rodriguez',
    role: 'Technical Lead',
    avatar: 'ER',
  },
  {
    title: 'Perfect Integration',
    content:
      'The API integration works flawlessly. The detailed dashboards help me understand exactly how my product is performing.',
    author: 'David Wilson',
    role: 'Product Manager',
    avatar: 'DW',
  },
]

export const SiteTestimonialsSection = ({
  className,
}: {
  className?: string
}) => {
  return (
    <div className={cn('w-full py-16', className)}>
      <div className="container max-w-screen-md mx-auto">
        <div className="flex flex-col">
          <MessageCircleHeart
            className="size-10 mb-4 stroke-2 mx-auto text-primary"
            fill="currentColor"
            fillOpacity={0.15}
          />

          <h2 className="mx-auto w-full max-w-xl mb-8 text-balance text-center text-2xl font-semibold !leading-[1.2] tracking-tight sm:text-3xl md:text-4xl">
            What our users <br /> are saying
          </h2>
          <div className="grid md:grid-cols-2 border rounded-md bg-secondary">
            {testimonials.map((item, index) => (
              <div
                key={index}
                className="bg-transparent h-full p-6 flex justify-between flex-col"
              >
                <div className="flex flex-col">
                  <Avatar className="size-10 rounded-md bg-primary/5 text-xs mb-4 text-primary">
                    <AvatarImage src="" />
                    <AvatarFallback>{item.avatar}</AvatarFallback>
                  </Avatar>
                  <h3 className="tracking-tight mb-2">{item.title}</h3>
                  <p className="text-muted-foreground max-w-xs">
                    {item.content}
                  </p>
                </div>
                <p className="flex flex-row gap-2 text-sm items-center mt-auto pt-6">
                  <span className="text-muted-foreground">By</span>
                  <span>{item.author}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{item.role}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
