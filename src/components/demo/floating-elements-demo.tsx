'use client'

import { motion } from 'framer-motion'
import { MessageCircleIcon, BotIcon, TrendingUpIcon, ShieldCheckIcon, ZapIcon, StarIcon } from 'lucide-react'

export function FloatingElementsDemo() {
  const floatingElements = [
    {
      icon: MessageCircleIcon,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      size: 'w-12 h-12',
      position: { top: '10%', left: '15%' },
      delay: 0,
      duration: 8,
    },
    {
      icon: BotIcon,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      size: 'w-16 h-16',
      position: { top: '20%', right: '10%' },
      delay: 1,
      duration: 10,
    },
    {
      icon: TrendingUpIcon,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      size: 'w-10 h-10',
      position: { bottom: '30%', left: '8%' },
      delay: 2,
      duration: 12,
    },
    {
      icon: ShieldCheckIcon,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      size: 'w-14 h-14',
      position: { bottom: '15%', right: '20%' },
      delay: 0.5,
      duration: 9,
    },
    {
      icon: ZapIcon,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      size: 'w-8 h-8',
      position: { top: '50%', left: '5%' },
      delay: 1.5,
      duration: 7,
    },
    {
      icon: StarIcon,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      size: 'w-12 h-12',
      position: { top: '70%', right: '5%' },
      delay: 2.5,
      duration: 11,
    },
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {floatingElements.map((element, index) => {
        const Icon = element.icon
        return (
          <motion.div
            key={index}
            className={`absolute ${element.size} ${element.bgColor} rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-lg`}
            style={element.position}
            animate={{
              y: [0, -30, 0],
              x: [0, 20, 0],
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: element.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: element.delay,
            }}
          >
            <Icon className={`${element.color} w-1/2 h-1/2`} />
          </motion.div>
        )
      })}
      
      {/* Floating particles */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-30"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 15 + Math.random() * 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  )
}