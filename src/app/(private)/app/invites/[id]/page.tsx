import { api } from '@/igniter.client'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { String } from '@/@saas-boilerplate/utils'
import { AppConfig } from '@/boilerplate.config'
import { CheckIcon } from 'lucide-react'
import { toast } from 'sonner'

export default async function InvitePage(props: {
  params: Promise<{ id: string }>
}) {
  const { params } = props
  const { id } = await params

  const invitation = await (api.invitation as any).findOne.query({
    params: { id },
  })

  if (!invitation.data) {
    redirect('/app')
  }

  const handleAccept = async () => {
    'use server'

    const toastId = toast.loading('Accepting invitation...')

    if (!invitation.data) return

    const { error } = await (api.invitation.accept as any).mutate({
      params: { id: invitation.data.id },
    })

    if (error) {
      toast.error('Failed to accept invitation', { id: toastId })
      return
    }

    toast.success('Invitation accepted!', { id: toastId })
    redirect('/app?welcome=true')
  }

  const handleReject = async () => {
    'use server'

    const toastId = toast.loading('Rejecting invitation...')

    if (!invitation.data) return

    const { error } = await (api.invitation.reject as any).mutate({
      params: { id: invitation.data.id },
    })

    if (error) {
      toast.error('Failed to reject invitation', { id: toastId })
      return
    }

    toast.success('Invitation rejected!', { id: toastId })
    redirect('/')
  }

  return (
    <section className="h-screen flex flex-col items-center justify-between py-16">
      <header>
        <Logo />
      </header>

      <section className="flex flex-col items-center text-center">
        <Avatar className="mb-8">
          <AvatarFallback>
            {String.getInitials(invitation.data.organizationName)}
          </AvatarFallback>
        </Avatar>

        <h1 className="text-md mb-8 max-w-[80%] leading-7">
          You are invited to join{' '}
          <u className="underline-offset-8 opacity-60">
            {invitation.data.organizationName}
          </u>{' '}
          by{' '}
          <u className="underline-offset-8 opacity-60">
            {invitation.data.inviterEmail}
          </u>
        </h1>

        <div className="flex items-center space-x-4">
          <Button type="button" onClick={handleAccept}>
            <CheckIcon />
            Accept
          </Button>

          <Button type="button" variant="ghost" onClick={handleReject}>
            Refuse
          </Button>
        </div>
      </section>

      <footer>
        <p className="text-sm text-slate-500">© {AppConfig.name}.</p>
      </footer>
    </section>
  )
}
