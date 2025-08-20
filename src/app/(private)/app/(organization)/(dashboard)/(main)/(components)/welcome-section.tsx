'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/@saas-boilerplate/features/auth/presentation/contexts/auth.context'
import { String } from '@/@saas-boilerplate/utils'

export function WelcomeSection() {
  const auth = useAuth()

  const organization = auth.session.organization
  const user = auth.session.user

  return (
    <section className="space-y-8">
      <header className="flex items-center">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center -space-x-2">
            <Avatar className="border rounded-full">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {String.getInitials(organization!.name)}
              </AvatarFallback>
              <AvatarImage src={organization!.logo as string} />
            </Avatar>
            <Avatar className="border rounded-full">
              <AvatarImage src={user.image as string} />
              <AvatarFallback className="!bg-accent">
                {String.getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <h1 className="text-md strong">Hi, {user.name},</h1>
            <div className="flex items-center gap-2">
              <h1 className="text-md opacity-50">
                here last updates on <strong>@{organization?.slug}</strong>{' '}
                workspace
              </h1>
            </div>
          </div>
        </div>
      </header>
    </section>
  )
}
