import {
  HelpCircleIcon,
  Layers2Icon,
  SendIcon,
  SettingsIcon,
  Smartphone,
  TrendingUp,
  Users2Icon,
  Bot,
} from 'lucide-react'

export const dashboardSidebarMenu = {
  groups: [
    {
      id: 'main-menu',
      name: '',
      menu: [
        {
          id: 'sidebar_overview',
          title: 'Overview',
          url: '/app',
          icon: Layers2Icon,
        },
        {
          id: 'sidebar_leads',
          title: 'Leads',
          url: '/app/leads',
          icon: Users2Icon,
        },
        {
          id: 'sidebar_submissions',
          title: 'Submissions',
          url: '/app/submissions',
          icon: SendIcon,
        },
        {
          id: 'sidebar_whatsapp',
          title: 'WhatsApp',
          url: '/app/whatsapp-instances',
          icon: Smartphone,
        },
        {
          id: 'sidebar_warmup',
          title: 'Aquecimento',
          url: '/app/warmup',
          icon: TrendingUp,
        },
        {
          id: 'sidebar_campaigns',
          title: 'Campanhas',
          url: '/app/campaigns',
          icon: SendIcon,
        },
        {
          id: 'sidebar_ai_agents',
          title: 'Agentes IA',
          url: '/app/ai-agents',
          icon: Bot,
        },
        {
          id: 'sidebar_chat',
          title: 'Chat',
          url: '/app/chat',
          icon: SendIcon,
        },
        {
          id: 'sidebar_crm',
          title: 'CRM',
          url: '/app/crm',
          icon: Users2Icon,
        },
        // {
        //   id: 'sidebar_integrations',
        //   title: 'Integrations',
        //   url: '/app/integrations',
        //   icon: PuzzleIcon,
        // },
        {
          id: 'sidebar_settings',
          title: 'Settings',
          url: '/app/settings/account/profile',
          icon: SettingsIcon,
        },
      ],
    },
    {
      id: 'support-menu',
      name: 'Support',
      menu: [
        {
          id: 'help-center',
          title: 'Help Center',
          url: '/help',
          icon: HelpCircleIcon,
        },
        {
          id: 'send-feedback',
          title: 'Send Feedback',
          url: '/contact',
          icon: SendIcon,
        },
      ],
    },
  ],
}
