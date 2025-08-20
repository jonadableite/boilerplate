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
import { BellRingIcon } from 'lucide-react'
import { useAuth } from '@/@saas-boilerplate/features/auth/presentation/contexts/auth.context'

const userTransactionNotificationsSchema = z.object({
  metadata: z.object({
    notifications: z.object({
      transactional: z.object({
        sales: z.boolean().default(true),
        reports: z.boolean().default(true),
      }),
    }),
  }),
})

export function UserTransactionNotificationSettingsForm() {
  const auth = useAuth()

  const form = useFormWithZod({
    mode: 'onChange',
    schema: userTransactionNotificationsSchema,
    defaultValues: {
      metadata: {
        notifications: {
          transactional: {
            sales:
              auth.session.user.metadata?.notifications?.transactional?.sales ??
              true,
            reports:
              auth.session.user.metadata?.notifications?.transactional
                ?.reports ?? true,
          },
        },
      },
    },
    onSubmit: async (values) => {
      const result = await tryCatch(
        api.user.update.mutate({
          body: {
            metadata: values.metadata,
          },
        }),
      )

      if (result.error) {
        toast.error('Error saving notification preferences', {
          description: 'Please check your data and try again',
        })
        return
      }

      toast.success(
        'Transactional notification preferences saved successfully!',
      )
    },
  })

  const transactionalNotifications = [
    {
      id: 'metadata.notifications.transactional.sales',
      label: 'Sales notifications',
      description: 'Receive notifications when new sales occur',
    },
    {
      id: 'metadata.notifications.transactional.reports',
      label: 'Reports',
      description: 'Receive periodic reports about your performance',
    },
  ]

  return (
    <Form {...form}>
      <form onSubmit={form.onSubmit}>
        <Annotated>
          <Annotated.Sidebar>
            <Annotated.Icon>
              <BellRingIcon className="w-4 h-4" />
            </Annotated.Icon>
            <Annotated.Title>Transactional Notifications</Annotated.Title>
            <Annotated.Description>
              Notifications related to your account and activities.
            </Annotated.Description>
          </Annotated.Sidebar>
          <Annotated.Content>
            <Annotated.Section>
              <div className="merge-form-section">
                {transactionalNotifications.map((notification) => (
                  <FormField
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
