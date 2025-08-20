import {
  User2Icon,
  BellIcon,
  LockIcon,
  SettingsIcon,
  UsersIcon,
  CreditCardIcon,
  Plug2Icon,
} from 'lucide-react'

export const settingsSidebarMenu = {
  groups: [
    {
      name: 'Account',
      menu: [
        {
          title: 'My Profile',
          url: '/app/settings/account/profile',
          icon: User2Icon,
        },
        {
          title: 'Notifications',
          url: '/app/settings/account/notifications',
          icon: BellIcon,
        },
        {
          title: 'Security',
          url: '/app/settings/account/security',
          icon: LockIcon,
        },
      ],
    },
    {
      name: 'Organization',
      menu: [
        {
          title: 'Settings',
          url: '/app/settings/organization/information',
          icon: SettingsIcon,
        },
        {
          title: 'Members',
          url: '/app/settings/organization/members',
          icon: UsersIcon,
        },
        {
          title: 'Billing',
          url: '/app/settings/organization/billing',
          icon: CreditCardIcon,
        },
      ],
    },
    {
      name: 'For Developers',
      menu: [
        {
          title: 'API Keys and Webhooks',
          url: '/app/settings/organization/integrations',
          icon: Plug2Icon,
        },
        {
          title: 'Documentation',
          url: '/docs',
          icon: Plug2Icon,
        },
      ],
    },
  ],
}
