import { BookOpen, FileQuestion, RefreshCw, MessageCircle, Settings, Zap } from 'lucide-react'

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
    title: 'Primeiros Passos',
    description: 'Como configurar sua conta e começar a usar nossa plataforma',
    icon: <BookOpen className="h-5 w-5 text-primary" />,
    href: '/docs/getting-started/primeiro-acesso',
  },
  {
    id: '2',
    title: 'WhatsApp Marketing',
    description: 'Tudo sobre campanhas, automação e estratégias de WhatsApp',
    icon: <MessageCircle className="h-5 w-5 text-primary" />,
    href: '/docs/whatsapp-instances/gerenciamento-instancias',
  },
  {
    id: '3',
    title: 'Integrações',
    description: 'Conecte nossa plataforma com suas ferramentas favoritas',
    icon: <RefreshCw className="h-5 w-5 text-primary" />,
    href: '/docs/introduction/recursos-principais',
  },
  {
    id: '4',
    title: 'Configurações',
    description: 'Personalize sua conta e configure preferências',
    icon: <Settings className="h-5 w-5 text-primary" />,
    href: '/docs/getting-started/configuracao-inicial',
  },
  {
    id: '5',
    title: 'Automação',
    description: 'Crie fluxos automatizados para otimizar seus resultados',
    icon: <Zap className="h-5 w-5 text-primary" />,
    href: '/docs/ai-agents/criacao-agentes',
  },
  {
    id: '6',
    title: 'Perguntas Frequentes',
    description: 'Respostas para as dúvidas mais comuns dos usuários',
    icon: <FileQuestion className="h-5 w-5 text-primary" />,
    href: '/docs/introduction/bem-vindo',
  },
]
