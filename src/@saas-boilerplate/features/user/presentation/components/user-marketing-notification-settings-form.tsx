'use client'

import * as React from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import { api } from '@/igniter.client'
import { useFormWithZod } from '@/@saas-boilerplate/hooks/use-form-with-zod'
import { tryCatch } from '@/@saas-boilerplate/utils/try-catch'
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form'
import { Annotated } from '@/components/ui/annotated'
import { Switch } from '@/components/ui/switch'
import { MailOpenIcon } from 'lucide-react'
import { useAuth } from '@/@saas-boilerplate/features/auth/presentation/contexts/auth.context'

const userMarketingNotificationsSchema = z.object({
  metadata: z.object({
    notifications: z.object({
      marketing: z.object({
        newsletter: z.boolean().default(true),
        updates: z.boolean().default(true),
      }),
    }),
  }),
})

export function UserMarketingNotificationSettingsForm() {
  const auth = useAuth()

  const form = useFormWithZod({
    mode: 'onChange',
    schema: userMarketingNotificationsSchema,
    defaultValues: {
      metadata: {
        notifications: {
          marketing: {
            newsletter:
              auth.session.user.metadata.notifications?.marketing?.newsletter ??
              true,
            updates:
              auth.session.user.metadata.notifications?.marketing?.updates ??
              true,
          },
        },
      },
    },
    onSubmit: async (values) => {
      const result = await tryCatch(
        api.user.update.mutate({
          body: {
            metadata: {
              notifications: {
                marketing: values.metadata.notifications.marketing,
              },
            },
          },
        }),
      )

      if (result.error) {
        toast.error('Error saving notification preferences', {
          description: 'Please check your data and try again',
        })

        return
      }

      toast.success('Marketing notification preferences saved successfully!')
    },
  })

  const marketingNotifications = [
    {
      id: 'metadata.notifications.marketing.newsletter',
      label: 'Newsletter',
      description: 'Receive our newsletter with tips and exclusive content',
    },
    {
      id: 'metadata.notifications.marketing.updates',
      label: 'Updates',
      description: 'Be notified about new features and platform improvements',
    },
  ] as const

  return (
    <Form {...form}>
      <form onSubmit={form.onSubmit}>
        <Annotated>
          <Annotated.Sidebar>
            <Annotated.Icon>
              <MailOpenIcon className="w-4 h-4" />
            </Annotated.Icon>
            <Annotated.Title>Marketing Notifications</Annotated.Title>
            <Annotated.Description>
              Notifications about news, promotions, and content.
            </Annotated.Description>
          </Annotated.Sidebar>
          <Annotated.Content>
            <Annotated.Section>
              <div className="merge-form-section">
                {marketingNotifications.map((notification) => (
                  <FormField
                    control={form.control}
                    key={notification.id}
                    name={notification.id}
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg text-sm border p-4">
                        <div className="space-y-0.5">
                          <h3>{notification.label}</h3>
                          <span className="text-muted-foreground">
                            {notification.description}
                          </span>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </Annotated.Section>
          </Annotated.Content>
        </Annotated>
      </form>
    </Form>
  )
}
