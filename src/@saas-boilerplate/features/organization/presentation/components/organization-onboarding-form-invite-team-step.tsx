'use client'

import React from 'react'
import {
  VerticalStep,
  VerticalStepContent,
  VerticalStepFooter,
  VerticalStepHeader,
  VerticalStepHeaderDescription,
  VerticalStepHeaderTitle,
  VerticalStepPreviousButton,
  VerticalStepSubmitButton,
} from '@/components/ui/form-step'
import { InvitationInput } from '@/@saas-boilerplate/features/invitation/presentation/components/invitation-input.component'
import { useFormContext, UseFormReturn } from 'react-hook-form'

export interface OrganizationOnboardingFormInviteTeamStepProps
  extends React.HTMLAttributes<HTMLDivElement> {
  step: string
  form: UseFormReturn<any>
}

export function OrganizationOnboardingFormInviteTeamStep({
  step,
}: OrganizationOnboardingFormInviteTeamStepProps) {
  const form = useFormContext()

  return (
    <VerticalStep step={step}>
      <VerticalStepHeader>
        <VerticalStepHeaderTitle>Invite your team</VerticalStepHeaderTitle>
        <VerticalStepHeaderDescription>
          Add team members to collaborate on your workspace.
        </VerticalStepHeaderDescription>
      </VerticalStepHeader>

      <VerticalStepContent>
        <div className="space-y-4">
          <InvitationInput form={form} />

          <p className="text-sm text-muted-foreground mt-4">
            Invited members will receive an email with instructions to access
            the platform.
          </p>
        </div>
      </VerticalStepContent>

      <VerticalStepFooter>
        <VerticalStepPreviousButton />
        <VerticalStepSubmitButton>Next</VerticalStepSubmitButton>
      </VerticalStepFooter>
    </VerticalStep>
  )
}
