'use client'

import { z } from 'zod'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowRightIcon } from 'lucide-react'
import { LoaderIcon } from '@/components/ui/loader-icon'
import { Checkbox } from '@/components/ui/checkbox'
import { useFormWithZod } from '@/@saas-boilerplate/hooks/use-form-with-zod'
import { api } from '@/igniter.client'
import { toast } from 'sonner'
import { tryCatch } from '@/@saas-boilerplate/utils/try-catch'
import { useRouter } from 'next/navigation'

const createWebhookSchema = z.object({
  url: z.string().url('Invalid URL'),
  secret: z.string().min(1, 'Secret is required'),
  events: z.array(z.string()).min(1, 'Select at least one event'),
})

interface CreateWebhookModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  availableEvents: string[]
}

export function CreateWebhookModal({
  open,
  onOpenChange,
  availableEvents,
}: CreateWebhookModalProps) {
  const router = useRouter()
  const createWebhookMutation = (api.webhook.create as any).useMutation()

  const form = useFormWithZod({
    schema: createWebhookSchema,
    defaultValues: {
      url: '',
      secret: '',
      events: [],
    },
    onSubmit: async (values) => {
      // Implementing error handling with tryCatch
      const result = await tryCatch(
        createWebhookMutation.mutate({
          body: {
            url: values.url,
            secret: values.secret,
            events: values.events,
          },
        }),
      )

      // Adding user feedback with toast
      if (result.error) {
        toast.error('Error creating webhook', {
          description: 'Please check your data and try again.',
        })
        return
      }

      toast.success('Webhook created successfully!')
      router.refresh()
      onOpenChange(false)
    },
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="">
        <Form {...form}>
          <form
            onSubmit={form.onSubmit}
            className="h-full flex flex-col space-y-6"
          >
            <SheetHeader>
              <SheetTitle>Create Webhook</SheetTitle>
              <SheetDescription>
                Configure a webhook to receive real-time updates about events in
                your workspace.
              </SheetDescription>
            </SheetHeader>

            <div className="merge-form-section flex-1">
              <FormField
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Webhook URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://api.example.com/webhook"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="secret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret Key</FormLabel>
                    <FormControl>
                      <Input placeholder="Webhook secret" {...field} />
                    </FormControl>
                    <FormDescription>
                      This secret will be used to verify webhook requests
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="events"
                render={() => (
                  <FormItem>
                    <FormLabel>Events</FormLabel>
                    <div className="space-y-2">
                      {availableEvents.map((event) => (
                        <FormField
                          key={event}
                          name="events"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={event}
                                variant="filled"
                                className="flex flex-row items-start space-x-3 space-y-0 p-3"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(event)}
                                    onCheckedChange={(checked) => {
                                      const updatedEvents = checked
                                        ? [...field.value, event]
                                        : field.value?.filter(
                                            (value: string) => value !== event,
                                          )
                                      field.onChange(updatedEvents)
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {event}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <SheetFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating...' : 'Create Webhook'}
                <LoaderIcon
                  icon={ArrowRightIcon}
                  isLoading={form.formState.isSubmitting}
                  className="w-4 h-4 ml-2"
                />
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
