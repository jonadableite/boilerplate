/* eslint-disable @next/next/no-img-element */
'use client'

import { cn } from '@/utils/cn'
import { Marquee } from '@/components/magicui/marquee'
import { motion } from 'framer-motion'

const reviews = [
  {
    name: 'Jack',
    username: '@jack',
    body: "I've never seen anything like this before. It's amazing. I love it.",
    img: 'https://avatar.vercel.sh/jack',
  },
  {
    name: 'Jill',
    username: '@jill',
    body: "I don't know what to say. I'm speechless. This is amazing.",
    img: 'https://avatar.vercel.sh/jill',
  },
  {
    name: 'John',
    username: '@john',
    body: "I'm at a loss for words. This is amazing. I love it.",
    img: 'https://avatar.vercel.sh/john',
  },
]

const firstRow = reviews.slice(0, reviews.length / 2)
const secondRow = reviews.slice(reviews.length / 2)
const thirdRow = reviews.slice(0, reviews.length / 2)
const fourthRow = reviews.slice(reviews.length / 2)

const ReviewCard = ({
  img,
  name,
  username,
  body,
}: {
  img: string
  name: string
  username: string
  body: string
}) => {
  return (
    <motion.figure
      className={cn(
        'relative h-full w-fit sm:w-36 cursor-pointer overflow-hidden rounded-xl border p-4',
        // light styles
        'border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]',
        // dark styles
        'dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]',
        // 3D enhancements
        'backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300',
        'hover:scale-105 hover:-translate-y-2 hover:rotate-1',
      )}
      whileHover={{
        scale: 1.05,
        rotateY: 5,
        rotateX: 5,
        z: 50,
        transition: { duration: 0.3, ease: 'easeOut' },
      }}
      whileTap={{
        scale: 0.95,
        transition: { duration: 0.1 },
      }}
      initial={{ opacity: 0, y: 20, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="flex flex-row items-center gap-2">
        <motion.img
          className="rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-300"
          width="32"
          height="32"
          alt=""
          src={img}
          whileHover={{ scale: 1.1, rotate: 5 }}
        />
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium dark:text-white">
            {name}
          </figcaption>
          <p className="text-xs font-medium dark:text-white/40">{username}</p>
        </div>
      </div>
      <blockquote className="mt-2 text-sm leading-relaxed">{body}</blockquote>

      {/* Shimmer effect */}
      <div className="absolute inset-0 -top-40 -left-40 w-80 h-80 bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-45 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </motion.figure>
  )
}

export function Marquee3D() {
  return (
    <motion.div
      className="relative flex h-96 w-full flex-row items-center justify-center gap-4 overflow-hidden [perspective:1000px] [transform-style:preserve-3d]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
    >
      <motion.div
        className="flex flex-row items-center gap-4 [transform-style:preserve-3d]"
        style={{
          transform:
            'translateX(-100px) translateY(0px) translateZ(-150px) rotateX(15deg) rotateY(-8deg) rotateZ(10deg)',
        }}
        initial={{ opacity: 0, scale: 0.8, rotateX: -30 }}
        animate={{
          opacity: 1,
          scale: 1,
          rotateX: 15,
          rotateY: [-8, -12, -8],
          rotateZ: [10, 15, 10],
        }}
        transition={{
          duration: 2,
          ease: 'easeOut',
          rotateY: { duration: 20, repeat: Infinity, ease: 'easeInOut' },
          rotateZ: { duration: 15, repeat: Infinity, ease: 'easeInOut' },
        }}
        whileHover={{
          rotateY: -15,
          rotateX: 25,
          scale: 1.05,
          z: 100,
          transition: { duration: 0.6, ease: 'easeOut' },
        }}
      >
        <motion.div
          style={{ transformStyle: 'preserve-3d' }}
          animate={{
            rotateY: [0, 3, 0],
            rotateX: [0, 1, 0],
            z: [0, 20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0,
          }}
          whileHover={{
            rotateY: 8,
            scale: 1.02,
            z: 50,
          }}
        >
          <Marquee pauseOnHover vertical className="[--duration:20s]">
            {firstRow.map((review, index) => (
              <motion.div
                key={review.username}
                initial={{ opacity: 0, x: -50, rotateY: -20 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.2,
                  ease: 'easeOut',
                }}
              >
                <ReviewCard {...review} />
              </motion.div>
            ))}
          </Marquee>
        </motion.div>

        <motion.div
          style={{ transformStyle: 'preserve-3d' }}
          animate={{
            rotateY: [0, -3, 0],
            rotateX: [0, -1, 0],
            z: [0, -15, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
          whileHover={{
            rotateY: -8,
            scale: 1.02,
            z: 30,
          }}
        >
          <Marquee reverse pauseOnHover className="[--duration:20s]" vertical>
            {secondRow.map((review, index) => (
              <motion.div
                key={review.username}
                initial={{ opacity: 0, x: 50, rotateY: 20 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.3,
                  ease: 'easeOut',
                }}
              >
                <ReviewCard {...review} />
              </motion.div>
            ))}
          </Marquee>
        </motion.div>

        <motion.div
          style={{ transformStyle: 'preserve-3d' }}
          animate={{
            rotateY: [0, 4, 0],
            rotateX: [0, 2, 0],
            z: [0, 25, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 4,
          }}
          whileHover={{
            rotateY: 10,
            scale: 1.03,
            z: 60,
          }}
        >
          <Marquee reverse pauseOnHover className="[--duration:20s]" vertical>
            {thirdRow.map((review, index) => (
              <motion.div
                key={review.username}
                initial={{ opacity: 0, y: -30, rotateX: -15 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.25,
                  ease: 'easeOut',
                }}
              >
                <ReviewCard {...review} />
              </motion.div>
            ))}
          </Marquee>
        </motion.div>

        <motion.div
          style={{ transformStyle: 'preserve-3d' }}
          animate={{
            rotateY: [0, -2, 0],
            rotateX: [0, -0.5, 0],
            z: [0, -10, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
          whileHover={{
            rotateY: -6,
            scale: 1.01,
            z: 20,
          }}
        >
          <Marquee pauseOnHover className="[--duration:20s]" vertical>
            {fourthRow.map((review, index) => (
              <motion.div
                key={review.username}
                initial={{ opacity: 0, y: 30, rotateX: 15 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{
                  duration: 0.8,
                  delay: index * 0.35,
                  ease: 'easeOut',
                }}
              >
                <ReviewCard {...review} />
              </motion.div>
            ))}
          </Marquee>
        </motion.div>
      </motion.div>

      {/* Enhanced gradient overlays with better blending - REMOVED BACKGROUND */}

      {/* Ambient lighting effect */}
      <motion.div
        className="pointer-events-none absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-gradient-radial from-primary/5 via-transparent to-transparent rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Floating particles effect */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute w-2 h-2 bg-primary/20 rounded-full blur-sm"
          style={{
            left: `${20 + i * 15}%`,
            top: `${30 + (i % 3) * 20}%`,
          }}
          animate={{
            y: [-20, -40, -20],
            x: [-10, 10, -10],
            opacity: [0.2, 0.8, 0.2],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 4 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.8,
          }}
        />
      ))}
    </motion.div>
  )
}
