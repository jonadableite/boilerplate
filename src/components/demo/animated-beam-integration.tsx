'use client'

import { forwardRef, useRef } from "react"
import { cn } from "@/utils/cn"
import { AnimatedBeam } from "@/components/magicui/animated-beam"
import { WhatsAppIcon } from "@/components/ui/icons/chat-providers"
import { BotIcon, TrendingUpIcon, BarChart3Icon, Share2Icon } from "lucide-react"

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className,
      )}
    >
      {children}
    </div>
  )
})

Circle.displayName = "Circle"

export function AnimatedBeamIntegration({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const div1Ref = useRef<HTMLDivElement>(null)
  const div2Ref = useRef<HTMLDivElement>(null)
  const div3Ref = useRef<HTMLDivElement>(null)
  const div4Ref = useRef<HTMLDivElement>(null)
  const div5Ref = useRef<HTMLDivElement>(null)

  return (
    <div
      className={cn(
        "relative flex h-[300px] w-full items-center justify-center overflow-hidden rounded-lg border bg-background p-10 md:shadow-xl",
        className,
      )}
      ref={containerRef}
    >
      <div className="flex h-full w-full flex-col items-stretch justify-between gap-10">
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div1Ref} className="border-green-500 bg-green-50">
            <WhatsAppIcon className="h-6 w-6 text-green-600" />
          </Circle>
          <Circle ref={div5Ref} className="border-purple-500 bg-purple-50">
            <Share2Icon className="h-6 w-6 text-purple-600" />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-between">
          <Circle ref={div2Ref} className="border-blue-500 bg-blue-50">
            <BotIcon className="h-6 w-6 text-blue-600" />
          </Circle>
          <Circle ref={div4Ref} className="border-emerald-500 bg-emerald-50">
            <BarChart3Icon className="h-6 w-6 text-emerald-600" />
          </Circle>
        </div>
        <div className="flex flex-row items-center justify-center">
          <Circle ref={div3Ref} className="border-orange-500 bg-orange-50">
            <TrendingUpIcon className="h-6 w-6 text-orange-600" />
          </Circle>
        </div>
      </div>

      {/* WhatsApp to Central Hub */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div5Ref}
        curvature={-75}
        endYOffset={-10}
        gradientStartColor="#25D366"
        gradientStopColor="#9c40ff"
      />

      {/* IA to Central Hub */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div5Ref}
        curvature={75}
        endYOffset={10}
        gradientStartColor="#3B82F6"
        gradientStopColor="#9c40ff"
      />

      {/* Leads to Central Hub */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div5Ref}
        curvature={-75}
        endYOffset={-10}
        gradientStartColor="#F97316"
        gradientStopColor="#9c40ff"
        reverse
      />

      {/* Central Hub to Vendas */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div5Ref}
        toRef={div4Ref}
        curvature={75}
        endYOffset={10}
        gradientStartColor="#9c40ff"
        gradientStopColor="#10B981"
      />

      {/* WhatsApp to IA (direct connection) */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div1Ref}
        toRef={div2Ref}
        curvature={-30}
        gradientStartColor="#25D366"
        gradientStopColor="#3B82F6"
        delay={1}
      />

      {/* IA to Leads (direct connection) */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div2Ref}
        toRef={div3Ref}
        curvature={30}
        gradientStartColor="#3B82F6"
        gradientStopColor="#F97316"
        delay={2}
      />

      {/* Leads to Vendas (direct connection) */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={div3Ref}
        toRef={div4Ref}
        curvature={-30}
        gradientStartColor="#F97316"
        gradientStopColor="#10B981"
        delay={3}
      />
    </div>
  )
}