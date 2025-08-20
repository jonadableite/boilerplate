import { BookOpen, FileQuestion, RefreshCw } from 'lucide-react'

type PopularCategory = {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  href: string
}

export const helpCategoriesMenu: PopularCategory[] = [
  {
    id: '1',
    title: 'Getting Started',
    description: 'How to set up your account and start using the platform',
    icon: <BookOpen className="h-5 w-5 text-primary" />,
    href: '/help/getting-started',
  },
  {
    id: '2',
    title: 'Integrations',
    description: 'Discover all the tools you can connect',
    icon: <RefreshCw className="h-5 w-5 text-primary" />,
    href: '/help/integrations',
  },
  {
    id: '3',
    title: 'FAQ',
    description: 'Answers to the most common questions',
    icon: <FileQuestion className="h-5 w-5 text-primary" />,
    href: '/help/faq',
  },
]
