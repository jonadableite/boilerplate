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
} from 'lucide-react'
import { useState } from 'react'
import { Logo } from '@/components/ui/logo'

export const SiteMainHeader = () => {
  const [isOpen, setOpen] = useState(false)
  return (
    <header className="w-full z-40 sticky top-0 left-0 bg-background/80 backdrop-blur-sm border-b">
      <div className="container relative mx-auto max-w-screen-md min-h-12 flex gap-4 flex-row lg:grid lg:grid-cols-[1fr_1fr_1fr] items-center">
        <Link
          href="/"
          className="justify-start items-center gap-4 lg:flex hidden flex-row hover:opacity-60"
        >
          <Logo />
        </Link>
        <div className="hidden lg:flex justify-center items-center gap-4">
          <Button variant="ghost" size="sm" className="rounded-full" asChild>
            <Link href="/pricing" className="flex items-center gap-2">
              <CreditCardIcon className="w-4 h-4" />
              Pricing
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full" asChild>
            <Link href="/help" className="flex items-center gap-2">
              <HelpCircleIcon className="w-4 h-4" />
              Help
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full" asChild>
            <Link href="/blog" className="flex items-center gap-2">
              <BookOpenIcon className="w-4 h-4" />
              Blog
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full" asChild>
            <Link href="/docs" className="flex items-center gap-2">
              <Code2Icon className="w-4 h-4" />
              Docs
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full" asChild>
            <Link href="/updates" className="flex items-center gap-2">
              <BellIcon className="w-4 h-4" />
              Changelog
            </Link>
          </Button>
        </div>
        <div className="flex items-center justify-end w-full gap-4">
          <Button variant="link" size="sm" asChild>
            <Link href="/auth">
              Sign In
              <ArrowUpRightIcon className="w-4 h-4" />
            </Link>
          </Button>
        </div>
        <div className="flex w-12 shrink lg:hidden items-end justify-end">
          <Button variant="ghost" onClick={() => setOpen(!isOpen)}>
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </header>
  )
}
