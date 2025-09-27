'use client'

import React, { useEffect } from 'react'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  VerticalStep,
  VerticalStepContent,
  VerticalStepFooter,
  VerticalStepHeader,
  VerticalStepHeaderDescription,
  VerticalStepHeaderTitle,
  VerticalStepSubmitButton,
} from '@/components/ui/form-step'
import { Input } from '@/components/ui/input'
import {
  SlugInputError,
  SlugInputField,
  SlugInputProvider,
  SlugInputRoot,
} from '@/components/ui/slug-input'
import { type UseFormReturn } from 'react-hook-form'
import { api } from '@/igniter.client'
import { toast } from 'sonner'
import { String, Url } from '@/@saas-boilerplate/utils'

export type OrganizationOnboardingFormCreateTeamStepProps =
  React.HTMLAttributes<HTMLDivElement> & {
    form: UseFormReturn<any, any>
    step: string
  }

export function OrganizationOnboardingFormCreateTeamStep({
  step,
  form,
}: OrganizationOnboardingFormCreateTeamStepProps) {
  const handleVerifySlug = async (slug: string) => {
    const disponibility = await (api.organization.verify as any).mutate({
      body: { slug },
    })
    if (disponibility.error) {
      toast.error('Error checking URL availability')
      return false
    }

    return disponibility.data.available
  }

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'name') {
        console.log('name changed')
        const slug = String.toSlug(value.name)
        console.log({ slug })
        form.setValue('slug', slug, { shouldValidate: true })
      }
    })
    return () => subscription.unsubscribe()
  }, [form.watch])

  return (
    <VerticalStep step={step}>
      <VerticalStepHeader>
        <VerticalStepHeaderTitle>
          Configure your workspace
        </VerticalStepHeaderTitle>
        <VerticalStepHeaderDescription>
          Set the name and custom URL for your workspace.
        </VerticalStepHeaderDescription>
      </VerticalStepHeader>

      <VerticalStepContent>
        <div className="merge-form-section">
          <FormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Workspace name</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: My Awesome Workspace" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="slug"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL for your workspace</FormLabel>
                <FormControl>
                  <SlugInputProvider
                    {...field}
                    checkSlugExists={handleVerifySlug}
                  >
                    <SlugInputRoot>
                      <SlugInputField
                        name="slug"
                        baseURL={Url.get('/stores/')}
                      />
                      <SlugInputError />
                    </SlugInputRoot>
                  </SlugInputProvider>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </VerticalStepContent>

      <VerticalStepFooter>
        <VerticalStepSubmitButton>Next</VerticalStepSubmitButton>
      </VerticalStepFooter>
    </VerticalStep>
  )
}
