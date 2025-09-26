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
  email: z.string().email('Por favor, insira um email válido'),
})

const otpValidationSchema = z.object({
  email: z.string().email('Por favor, insira um email válido'),
  code: z
    .string()
    .min(6, 'O código deve ter 6 dígitos')
    .max(6, 'O código deve ter 6 dígitos'),
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
      try {
        const result = await (api.auth.sendOTPVerificationCode as any).mutate({
          body: {
            type: 'sign-in',
            email: values.email,
          },
        })

        if (result.error) {
          toast.error('Erro ao enviar código')
          return
        }

        toast.success(`Código OTP enviado para ${values.email}`)
        setOTPEmail(values.email)
      } catch (error) {
        toast.error('Erro ao enviar código')
        console.error('Error sending OTP:', error)
      }
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
      },
    },
    exit: (isOTP: boolean) => ({
      opacity: 0,
      x: isOTP ? 20 : -20,
      transition: {
        duration: 0.2,
      },
    }),
  }

  return (
    <section className={cn('space-y-6 relative overflow-hidden', className)}>
      <AnimatePresence mode="wait" initial={false}>
        {OTPEmail ? (
          <motion.div
            key="otp-form"
            custom={true}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-white">
                Verificar código
              </h1>
              <p className="text-white/70">
                Enviamos um código de 6 dígitos para{' '}
                <span className="font-medium text-white">{OTPEmail}</span>
              </p>
            </div>
            <AuthValidateOTPCodeForm
              email={OTPEmail}
              onBack={() => setOTPEmail(null)}
              redirectUrl={redirectUrl}
            />
          </motion.div>
        ) : (
          <motion.div
            key="sign-in-form"
            custom={false}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-white">
                Entrar na sua conta
              </h1>
              <p className="text-white/70">
                Bem-vindo de volta! Faça login para continuar.
              </p>
            </div>

            <SignInWithSocialProviderForm />

            <SeparatorWithText className="text-white/50">ou</SeparatorWithText>

            <SignInWithCredentialForm form={form} />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function SignInWithSocialProviderForm() {
  const [socialProviders] = useState(getActiveSocialProviders())

  const signInWithProvider = (api.auth.signInWithProvider as any).useMutation({
    onRequest: (response: any) => {
      if (response.error) {
        return toast.error('Erro ao entrar')
      }

      if (response.data.redirect && response.data.url)
        window.location.href = response.data.url
      toast.success('Login realizado com sucesso!')
    },
  })

  return (
    <div className={cn('flex flex-col space-y-4')}>
      {socialProviders.map((provider) => (
        <Button
          key={provider.id}
          className="w-full justify-between bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
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
          Entrar com {provider.name}
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
              <FormLabel className="text-white">E-mail</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  variant="outline"
                  placeholder="nome@exemplo.com"
                  className="h-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 backdrop-blur-sm"
                  disabled={form.formState.isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-red-300" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full h-10 justify-between bg-white text-black hover:bg-white/90"
          disabled={form.formState.isSubmitting}
        >
          Enviar código de verificação
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
  const signIn = (api.auth.signInWithOTP as any).useMutation()
  const resendOTPCode = (api.auth.sendOTPVerificationCode as any).useMutation()

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
        toast.error('Código inválido. Tente novamente.')
        return
      }

      toast.success('Código verificado com sucesso!')
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

    toast.success(`Novo código enviado para ${email}`)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.onSubmit} className="space-y-6">
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-8 mb-2 text-white/70 hover:text-white hover:bg-white/10"
            onClick={onBack}
            type="button"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao login
          </Button>
        </div>

        <div className="space-y-4">
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
                    className="justify-center"
                  >
                    <InputOTPGroup className="bg-white/10 border-white/20 backdrop-blur-sm">
                      <InputOTPSlot
                        index={0}
                        className="text-white border-white/20"
                      />
                      <InputOTPSlot
                        index={1}
                        className="text-white border-white/20"
                      />
                      <InputOTPSlot
                        index={2}
                        className="text-white border-white/20"
                      />
                    </InputOTPGroup>
                    <InputOTPSeparator className="text-white/50">
                      -
                    </InputOTPSeparator>
                    <InputOTPGroup className="bg-white/10 border-white/20 backdrop-blur-sm">
                      <InputOTPSlot
                        index={3}
                        className="text-white border-white/20"
                      />
                      <InputOTPSlot
                        index={4}
                        className="text-white border-white/20"
                      />
                      <InputOTPSlot
                        index={5}
                        className="text-white border-white/20"
                      />
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>
                <FormMessage className="text-red-300" />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col items-center space-y-4">
          <Button
            className="w-full h-10 bg-white text-black hover:bg-white/90"
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            <LoaderIcon
              icon={Mail}
              className="mr-2 h-4 w-4"
              isLoading={form.formState.isSubmitting}
            />
            {form.formState.isSubmitting
              ? 'Verificando...'
              : 'Verificar código'}
          </Button>

          <p className="text-sm text-white/70 text-center">
            Não recebeu o código?{' '}
            <Button
              variant="link"
              className="p-0 h-auto font-normal text-white hover:text-white/80 underline"
              onClick={handleResendCode}
              disabled={resendOTPCode.loading}
            >
              {resendOTPCode.loading ? 'Enviando...' : 'Clique para reenviar'}
            </Button>
          </p>
        </div>
      </form>
    </Form>
  )
}
