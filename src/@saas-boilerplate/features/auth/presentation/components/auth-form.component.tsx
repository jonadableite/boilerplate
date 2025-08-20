'use client'

import { useState } from 'react'
import { z } from 'zod'
import { cn } from '@/utils/cn'
import { ArrowLeft, Mail } from 'lucide-react'
import { api } from '@/igniter.client'
import { useFormWithZod } from '@/@saas-boilerplate/hooks/use-form-with-zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoaderIcon } from '@/components/ui/loader-icon'
import { SeparatorWithText } from '@/components/ui/separator-with-text'
import { toast } from 'sonner'
import { getActiveSocialProviders } from '@/utils/get-social-providers'
import { useRouter } from 'next/navigation'
import { UseFormReturn } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email'),
})

const otpValidationSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  code: z
    .string()
    .min(6, 'Code must be 6 digits')
    .max(6, 'Code must be 6 digits'),
})

export function AuthForm({
  className,
  redirectUrl,
}: {
  className?: string
  redirectUrl?: string
}) {
  const [OTPEmail, setOTPEmail] = useState<string | null>(null)

  const form = useFormWithZod({
    schema: signInSchema,
    onSubmit: async (values) => {
      const result = await api.auth.sendOTPVerificationCode.mutate({
        body: {
          type: 'sign-in',
          email: values.email,
        },
      })

      if (result.error) {
        toast.error('Error sending code')
        return
      }

      toast.success(`OTP code sent to ${values.email}`)
      setOTPEmail(values.email)
    },
  })

  // Animation variants
  const containerVariants = {
    hidden: (isOTP: boolean) => ({
      opacity: 0,
      x: isOTP ? -20 : 20,
    }),
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
    exit: (isOTP: boolean) => ({
      opacity: 0,
      x: isOTP ? 20 : -20,
      transition: {
        duration: 0.2,
        ease: 'easeIn',
      },
    }),
  }

  return (
    <section
      className={cn('space-y-6 px-8 relative overflow-hidden', className)}
    >
      <AnimatePresence mode="wait" initial={false}>
        {OTPEmail ? (
          <motion.div
            key="otp-form"
            custom={true}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className="w-full"
          >
            <AuthValidateOTPCodeForm
              redirectUrl={redirectUrl}
              email={OTPEmail}
              onBack={() => setOTPEmail(null)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="auth-form"
            custom={false}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className="w-full"
          >
            <header className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
              <p className="text-sm text-muted-foreground">
                Sign in to your account using one of the methods below
              </p>
            </header>
            <main className="space-y-6">
              <SignInWithCredentialForm form={form} />
              <SeparatorWithText>Or sign in with</SeparatorWithText>
              <SignInWithSocialProviderForm />
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function SignInWithSocialProviderForm() {
  const [socialProviders] = useState(getActiveSocialProviders())

  const signInWithProvider = api.auth.signInWithProvider.useMutation({
    onRequest: (response) => {
      if (response.error) {
        return toast.error('Error signing in')
      }

      if (response.data.redirect && response.data.url)
        window.location.href = response.data.url
      toast.success('Successfully signed in!')
    },
  })

  return (
    <div className={cn('flex flex-col space-y-4')}>
      {socialProviders.map((provider) => (
        <Button
          key={provider.id}
          className="w-full justify-between"
          variant="outline"
          type="button"
          disabled={signInWithProvider.loading}
          onClick={() =>
            signInWithProvider.mutate({
              body: {
                provider: provider.id,
              },
            })
          }
        >
          Sign in with {provider.name}
          <LoaderIcon
            icon={provider.icon}
            className="h-4 w-4"
            isLoading={signInWithProvider.loading}
          />
        </Button>
      ))}
    </div>
  )
}

function SignInWithCredentialForm({
  form,
}: {
  form: UseFormReturn<any> & { onSubmit: any }
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.onSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem variant="unstyled">
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  variant="outline"
                  placeholder="name@example.com"
                  className="h-10"
                  disabled={form.formState.isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full h-10 justify-between"
          disabled={form.formState.isSubmitting}
        >
          Send verification code
          <LoaderIcon
            icon={Mail}
            className="mr-2 h-4 w-4"
            isLoading={form.formState.isSubmitting}
          />
        </Button>
      </form>
    </Form>
  )
}

function AuthValidateOTPCodeForm({
  email,
  onBack,
  redirectUrl,
}: {
  email: string
  onBack: () => void
  redirectUrl?: string
}) {
  const router = useRouter()
  const signIn = api.auth.signInWithOTP.useMutation()
  const resendOTPCode = api.auth.sendOTPVerificationCode.useMutation()

  const form = useFormWithZod({
    schema: otpValidationSchema,
    defaultValues: {
      email,
      code: '',
    },
    onSubmit: async (values) => {
      const result = await signIn.mutate({
        body: {
          email: values.email,
          otpCode: values.code,
        },
      })

      if (result.error) {
        toast.error('Invalid code. Please try again.')
        return
      }

      toast.success('Code verified successfully!')
      router.push(redirectUrl || '/app')
    },
  })

  const handleResendCode = () => {
    resendOTPCode.mutate({
      body: {
        type: 'sign-in',
        email,
      },
    })

    toast.success(`New code sent to ${email}`)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.onSubmit} className="space-y-6">
        <header className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-8 mb-2 hover:bg-transparent"
            onClick={onBack}
            type="button"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Button>
          <h2 className="text-2xl font-semibold tracking-tight">
            Check your email
          </h2>
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent a verification code to{' '}
            <span className="font-medium">{email}</span>
          </p>
        </header>

        <main className="space-y-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem variant="unstyled">
                <FormControl>
                  <InputOTP
                    value={field.value}
                    onChange={field.onChange}
                    maxLength={6}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator>-</InputOTPSeparator>
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </main>

        <footer className="flex flex-col justify-center">
          <Button
            className="w-fit h-10"
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            <LoaderIcon
              icon={Mail}
              className="mr-2 h-4 w-4"
              isLoading={form.formState.isSubmitting}
            />
            {form.formState.isSubmitting ? 'Verifying...' : 'Verify Email'}
          </Button>

          <p className="text-sm text-muted-foreground/80 mt-2">
            Didn&apos;t receive the code?{' '}
            <Button
              variant="link"
              className="p-0 h-auto font-normal"
              onClick={handleResendCode}
              disabled={resendOTPCode.loading}
            >
              {resendOTPCode.loading ? 'Sending...' : 'Click to resend'}
            </Button>
          </p>
        </footer>
      </form>
    </Form>
  )
}
