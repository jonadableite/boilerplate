'use client'

import React, { useState } from 'react'

import { z } from 'zod'
import { toast } from 'sonner'
import { api } from '@/igniter.client'
import { VerticalStepForm } from '@/components/ui/form-step'
import { cn } from '@/utils/cn'
import { useFormWithZod } from '@/@saas-boilerplate/hooks/use-form-with-zod'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Logo } from '@/components/ui/logo'
import { ArrowRightIcon } from 'lucide-react'
import { OrganizationOnboardingFormCreateTeamStep } from './organization-onboarding-form-create-team-step'
import { OrganizationOnboardingFormProfileStep } from './organization-onboarding-form-profile-step'
import { OrganizationOnboardingFormInviteTeamStep } from './organization-onboarding-form-invite-team-step'
import { AppConfig } from '@/boilerplate.config'

const organizationSchema = z.object({
  name: z.string().min(3, 'Organization name must have at least 3 characters'),
  slug: z.string().min(3, 'URL must have at least 3 characters'),
  invites: z
    .array(
      z.object({
        email: z.string().email('Invalid email'),
        role: z.enum(['admin', 'member', 'owner']),
      }),
    )
    .optional(),
  owner: z.object({
    name: z.string().min(3, 'Your name must have at least 3 characters'),
    metadata: z.object({
      contact: z.object({
        phone: z.string().min(10, 'Invalid phone number'),
      }),
      extra: z.object({
        referral_source: z.string().min(1, 'Please select how you found us'),
      }),
    }),
  }),
})

export function OnboardingForm() {
  const [welcome, setWelcome] = useState(true)

  const form = useFormWithZod({
    schema: organizationSchema,
    onSubmit: async (values) => {
      const orgResult = await api.organization.create.mutate({ body: values })
      await api.user.update.mutate({ body: values.owner })

      if (orgResult.error) {
        toast.error('An error occurred while creating your company', {
          description: 'Please check the data and try again.',
        })
        return
      }

      toast.success('Your organization has been created successfully!')
      window.location.replace('/app/?welcome=true')
    },
  })

  if (welcome) {
    return (
      <section className="space-y-6 h-full flex flex-col justify-center items-center animate-in fade-in duration-700 slide-in-from-bottom-8">
        <header className="space-y-4 flex flex-col items-center text-center">
          <Logo className="h-9 animate-in fade-in zoom-in duration-1000 delay-300" />
          <h1 className="text-3xl font-semibold tracking-tight max-w-screen-md animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            Welcome to <br /> {AppConfig.name}
          </h1>
          <p className="text-sm text-muted-foreground max-w-[360px] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            Ready to streamline your workflow and boost your productivity? Let s
            set up your customized workspace in just a few minutes!
          </p>
        </header>
        <footer className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <Button
            onClick={() => setWelcome(false)}
            size="sm"
            className="transition-all hover:scale-105"
          >
            Create my workspace now
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </Button>
        </footer>
      </section>
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.onSubmit}
        className="space-y-6 max-w-screen-sm relative h-full mx-auto"
      >
        <VerticalStepForm
          form={form}
          schema={organizationSchema}
          className={cn('h-full')}
          initialStep="create-team"
          steps={{
            'create-team': {
              id: 'create-team',
              fields: ['name', 'slug'],
              validate: async (values) => {
                const teamSchema = organizationSchema.pick({
                  name: true,
                  slug: true,
                })
                return teamSchema.safeParse(values).success
              },
            },
            profile: {
              id: 'profile',
              fields: [
                'owner.name',
                'owner.metadata.contact.phone',
                'owner.metadata.extra.referral_source',
              ],
              validate: async (values) => {
                const profileSchema = organizationSchema.pick({
                  owner: true,
                })
                return profileSchema.safeParse(values).success
              },
            },
            'invite-team': {
              id: 'invite-team',
              fields: ['invites'],
              validate: async (values) => {
                const inviteSchema = organizationSchema.pick({
                  invites: true,
                })
                return inviteSchema.safeParse(values).success
              },
            },
          }}
        >
          <OrganizationOnboardingFormCreateTeamStep
            form={form}
            step="create-team"
          />
          <OrganizationOnboardingFormProfileStep form={form} step="profile" />
          <OrganizationOnboardingFormInviteTeamStep
            form={form}
            step="invite-team"
          />
        </VerticalStepForm>
      </form>
    </Form>
  )
}
