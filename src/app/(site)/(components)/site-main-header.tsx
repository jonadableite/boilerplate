'use client'

import { Link } from 'next-view-transitions'
import { Button } from '@/components/ui/button'
import {
  ArrowUpRightIcon,
  BellIcon,
  BookOpenIcon,
  Code2Icon,
  CreditCardIcon,
  HelpCircleIcon,
  Menu,
  X,
  SparklesIcon,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Logo } from '@/components/ui/logo'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

export const SiteMainHeader = () => {
  const [isOpen, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { href: '/pricing', label: 'Preços', icon: CreditCardIcon },
    { href: '/help', label: 'Ajuda', icon: HelpCircleIcon },
    { href: '/blog', label: 'Blog', icon: BookOpenIcon },
    { href: '/docs', label: 'Documentação', icon: Code2Icon },
    { href: '/updates', label: 'Novidades', icon: BellIcon },
  ]

  return (
    <motion.header
      className={cn(
        'w-full z-50 sticky top-0 left-0 transition-all duration-500',
        scrolled
          ? 'bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-primary/5'
          : 'bg-background/80 backdrop-blur-sm border-b border-transparent',
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* Gradient overlay for modern effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 opacity-50" />

      <div className="container relative mx-auto max-w-screen-xl min-h-16 flex gap-4 flex-row lg:grid lg:grid-cols-[1fr_2fr_1fr] items-center px-4">
        {/* Logo Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Link
            href="/"
            className="justify-start items-center gap-3 lg:flex hidden flex-row group"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Logo />
            </motion.div>
          </Link>
        </motion.div>

        {/* Navigation Menu */}
        <motion.nav
          className="hidden lg:flex justify-center items-center gap-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {navItems.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
            >
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-300 group relative overflow-hidden"
                asChild
              >
                <Link
                  href={item.href}
                  className="flex items-center gap-2 relative z-10"
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <item.icon className="w-4 h-4" />
                  </motion.div>
                  <span className="font-medium">{item.label}</span>

                  {/* Hover effect background */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full"
                    initial={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </Link>
              </Button>
            </motion.div>
          ))}
        </motion.nav>

        {/* CTA Section */}
        <motion.div
          className="flex items-center justify-end w-full gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="default"
              size="sm"
              className="rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
              asChild
            >
              <Link
                href="/auth"
                className="flex items-center gap-2 relative z-10"
              >
                <span className="font-semibold">Entrar</span>
                <motion.div
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <ArrowUpRightIcon className="w-4 h-4" />
                </motion.div>

                {/* Animated background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Mobile Menu Button */}
        <motion.div
          className="flex w-12 shrink lg:hidden items-end justify-end"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              onClick={() => setOpen(!isOpen)}
              className="rounded-full hover:bg-primary/10 transition-all duration-300 relative overflow-hidden group"
            >
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pulse effect */}
              <motion.div
                className="absolute inset-0 bg-primary/20 rounded-full"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.2, 0], opacity: [0, 0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </Button>
          </motion.div>
        </motion.div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="lg:hidden absolute top-full left-0 w-full bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-xl"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="container mx-auto px-4 py-6">
              <motion.div
                className="flex flex-col gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {/* Mobile Logo */}
                <motion.div
                  className="flex items-center justify-center pb-4 border-b border-border/30"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Link href="/" className="flex items-center gap-3">
                    <Logo />
                    <SparklesIcon className="w-5 h-5 text-primary/60" />
                  </Link>
                </motion.div>

                {/* Mobile Navigation */}
                <div className="grid grid-cols-1 gap-2">
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.href}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 * (index + 3) }}
                    >
                      <Button
                        variant="ghost"
                        size="lg"
                        className="w-full justify-start rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-300 group"
                        asChild
                        onClick={() => setOpen(false)}
                      >
                        <Link
                          href={item.href}
                          className="flex items-center gap-3"
                        >
                          <motion.div
                            whileHover={{ scale: 1.2, rotate: 10 }}
                            transition={{
                              type: 'spring',
                              stiffness: 400,
                              damping: 17,
                            }}
                          >
                            <item.icon className="w-5 h-5" />
                          </motion.div>
                          <span className="font-medium text-base">
                            {item.label}
                          </span>
                        </Link>
                      </Button>
                    </motion.div>
                  ))}
                </div>

                {/* Mobile CTA */}
                <motion.div
                  className="pt-4 border-t border-border/30"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button
                    size="lg"
                    className="w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
                    asChild
                    onClick={() => setOpen(false)}
                  >
                    <Link
                      href="/auth"
                      className="flex items-center justify-center gap-2"
                    >
                      <span className="font-semibold">
                        Entrar na Plataforma
                      </span>
                      <ArrowUpRightIcon className="w-5 h-5" />
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
