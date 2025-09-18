'use client'

import { forwardRef, useRef } from "react"
import { cn } from "@/utils/cn"
import { AnimatedBeam } from "@/components/magicui/animated-beam"
import { WhatsAppIcon } from "@/components/ui/icons/chat-providers"
import { 
  BotIcon, 
  TrendingUpIcon, 
  BarChart3Icon, 
  HeartHandshakeIcon,
  ActivityIcon,
  DatabaseIcon,
  MonitorIcon,
  ThermometerIcon
} from "lucide-react"

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

export function AnimatedBeamPlatformFlow({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const whatsappRef = useRef<HTMLDivElement>(null)
  const aquecedorRef = useRef<HTMLDivElement>(null)
  const monitoramentoRef = useRef<HTMLDivElement>(null)
  const leadsRef = useRef<HTMLDivElement>(null)
  const plataformaRef = useRef<HTMLDivElement>(null)
  const iaRef = useRef<HTMLDivElement>(null)
  const analiseRef = useRef<HTMLDivElement>(null)
  const dashboardRef = useRef<HTMLDivElement>(null)

  return (
    <div
      className={cn(
        "relative flex h-[300px] w-full items-center justify-center overflow-hidden rounded-lg border bg-background p-6 md:shadow-xl",
        className,
      )}
      ref={containerRef}
    >
      <div className="flex h-full w-full flex-col items-stretch justify-between gap-4">
        {/* Linha superior */}
        <div className="flex flex-row items-center justify-between">
          <Circle ref={whatsappRef} className="border-green-500 bg-green-50">
            <WhatsAppIcon className="h-6 w-6 text-green-600" />
          </Circle>
          <Circle ref={aquecedorRef} className="border-red-500 bg-red-50">
            <ThermometerIcon className="h-6 w-6 text-red-600" />
          </Circle>
          <Circle ref={monitoramentoRef} className="border-blue-500 bg-blue-50">
            <ActivityIcon className="h-6 w-6 text-blue-600" />
          </Circle>
        </div>
        
        {/* Linha do meio */}
        <div className="flex flex-row items-center justify-between">
          <Circle ref={leadsRef} className="border-orange-500 bg-orange-50">
            <TrendingUpIcon className="h-6 w-6 text-orange-600" />
          </Circle>
          <Circle ref={plataformaRef} className="border-purple-500 bg-purple-50 h-16 w-16">
            <DatabaseIcon className="h-8 w-8 text-purple-600" />
          </Circle>
          <Circle ref={iaRef} className="border-cyan-500 bg-cyan-50">
            <BotIcon className="h-6 w-6 text-cyan-600" />
          </Circle>
        </div>
        
        {/* Linha inferior */}
        <div className="flex flex-row items-center justify-between">
          <Circle ref={analiseRef} className="border-emerald-500 bg-emerald-50">
            <BarChart3Icon className="h-6 w-6 text-emerald-600" />
          </Circle>
          <Circle ref={dashboardRef} className="border-indigo-500 bg-indigo-50">
            <MonitorIcon className="h-6 w-6 text-indigo-600" />
          </Circle>
        </div>
      </div>

      {/* WhatsApp para Plataforma */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={whatsappRef}
        toRef={plataformaRef}
        curvature={-30}
        gradientStartColor="#25D366"
        gradientStopColor="#9c40ff"
      />

      {/* Aquecedor para Plataforma */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={aquecedorRef}
        toRef={plataformaRef}
        curvature={0}
        gradientStartColor="#EF4444"
        gradientStopColor="#9c40ff"
        delay={0.5}
      />

      {/* Monitoramento para Plataforma */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={monitoramentoRef}
        toRef={plataformaRef}
        curvature={30}
        gradientStartColor="#3B82F6"
        gradientStopColor="#9c40ff"
        delay={1}
      />

      {/* Leads para Plataforma */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={leadsRef}
        toRef={plataformaRef}
        curvature={0}
        gradientStartColor="#F97316"
        gradientStopColor="#9c40ff"
        delay={1.5}
      />

      {/* IA para Plataforma */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={iaRef}
        toRef={plataformaRef}
        curvature={0}
        gradientStartColor="#06B6D4"
        gradientStopColor="#9c40ff"
        delay={2}
      />

      {/* Plataforma para Análise */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={plataformaRef}
        toRef={analiseRef}
        curvature={-30}
        gradientStartColor="#9c40ff"
        gradientStopColor="#10B981"
        reverse
        delay={2.5}
      />

      {/* Plataforma para Dashboard */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={plataformaRef}
        toRef={dashboardRef}
        curvature={30}
        gradientStartColor="#9c40ff"
        gradientStopColor="#6366F1"
        reverse
        delay={3}
      />

      {/* Conexões diretas entre componentes */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={whatsappRef}
        toRef={iaRef}
        curvature={-60}
        gradientStartColor="#25D366"
        gradientStopColor="#06B6D4"
        delay={3.5}
      />

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={iaRef}
        toRef={analiseRef}
        curvature={-30}
        gradientStartColor="#06B6D4"
        gradientStopColor="#10B981"
        delay={4}
      />

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={analiseRef}
        toRef={dashboardRef}
        curvature={0}
        gradientStartColor="#10B981"
        gradientStopColor="#6366F1"
        delay={4.5}
      />
    </div>
  )
}