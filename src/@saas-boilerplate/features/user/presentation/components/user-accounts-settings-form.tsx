'use client'
import type { AccountProvider } from '@/@saas-boilerplate/features/account'

import * as React from 'react'

import { Annotated } from '@/components/ui/annotated'
import { ArrowRightIcon, LockIcon } from 'lucide-react'
import { getActiveSocialProviders } from '@/utils/get-social-providers'
import { Button } from '@/components/ui/button'
import { api } from '@/igniter.client'
import { toast } from 'sonner'
import { delay } from '@/@saas-boilerplate/utils/delay'

export function UserAccountsSettingsForm() {
  const socialProviders = getActiveSocialProviders()
  const accounts = (api.account.findManyByCurrentUser as any).query()

  const handleLinkAccount = async (provider: AccountProvider) => {
    toast.loading('Connecting account...')

    const response = await (api.account.link as any).mutate({
      body: {
        provider,
        callbackURL: window.location.href,
      },
    })

    if (response.error) {
      toast.error(
        'An error occurred while trying to connect the account. Please try again.',
      )
      return
    }

    if (response.data.redirect && response.data.url) {
      toast.success('Redirecting to authentication page...')
      delay(1000)
      window.location.href = response.data.url
    }
  }

  const handleUnlinkAccount = async (provider: AccountProvider) => {
    toast.loading('Disconnecting account...')

    const response = await (api.account.unlink as any).mutate({
      body: {
        provider,
      },
    })

    if (response.error) {
      toast.error(
        'An error occurred while trying to disconnect the account. Please try again.',
      )
      return
    }

    toast.success('Account disconnected successfully.')
  }

  return (
    <Annotated>
      <Annotated.Sidebar>
        <Annotated.Icon>
          <LockIcon className="w-4 h-4" />
        </Annotated.Icon>
        <Annotated.Title>Connected accounts</Annotated.Title>
        <Annotated.Description>
          Streamline your access by connecting your account to a provider for
          faster login.
        </Annotated.Description>
      </Annotated.Sidebar>
      <Annotated.Content>
        <Annotated.Section>
          <div className="merge-form-section">
            {socialProviders.map((provider) => (
              <div
                className="flex space-x-4 items-center justify-between py-4 text-sm"
                key={provider.id}
              >
                <div className="flex items-center space-x-4">
                  {provider.icon && <provider.icon className="size-4" />}
                  <h3 className="flex-1">{provider.name}</h3>
                </div>

                <div className="text-sm flex items-center space-x-4">
                  {!accounts.error &&
                    accounts.data?.find(
                      (account: { provider: AccountProvider }) =>
                        account.provider === provider.id,
                    ) && (
                      <span className="text-muted-foreground">Connected</span>
                    )}

                  {!accounts.error &&
                    !accounts.data?.find(
                      (account: { provider: AccountProvider }) =>
                        account.provider === provider.id,
                    ) && (
                      <span className="text-muted-foreground">
                        Not connected
                      </span>
                    )}

                  {!accounts.error &&
                    !accounts.data?.find(
                      (account: { provider: AccountProvider }) =>
                        account.provider === provider.id,
                    ) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleLinkAccount(provider.id)}
                      >
                        Connect
                        <ArrowRightIcon />
                      </Button>
                    )}

                  {!accounts.error &&
                    accounts.data?.find(
                      (account: { provider: AccountProvider }) =>
                        account.provider === provider.id,
                    ) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnlinkAccount(provider.id)}
                      >
                        Disconnect
                        <ArrowRightIcon />
                      </Button>
                    )}
                </div>
              </div>
            ))}
          </div>
        </Annotated.Section>
      </Annotated.Content>
    </Annotated>
  )
}
