import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef } from 'react'
import {
  useForm,
  UseFormReturn,
  type FieldValues,
  type UseFormProps,
} from 'react-hook-form'
import type { ZodSchema } from 'zod'

type HookFormParams<TFieldValues extends FieldValues, TContext> = UseFormProps<
  TFieldValues,
  TContext
>

type UseFormOptions<TSchema extends ZodSchema> = Omit<
  HookFormParams<TSchema, any>,
  'onSubmit'
> & {
  schema: TSchema
  defaultValues?: ZodSchema['_input']
  onSubmit?: (values: ZodSchema['_input']) => void
}

type Return<TSchema extends ZodSchema> = UseFormReturn<TSchema['_output']> & {
  onSubmit: any
}

export function useFormWithZod<TSchema extends ZodSchema>({
  schema,
  defaultValues,
  onSubmit,
  mode,
  ...rest
}: UseFormOptions<TSchema>): Return<TSchema> {
  const form = useForm<ZodSchema['_output']>({
    resolver: zodResolver(schema),
    defaultValues,
    mode,
    ...rest,
  })

  const prevDefaultValuesRef = useRef(defaultValues)

  useEffect(() => {
    if (mode === 'onChange') {
      let timeoutId: NodeJS.Timeout

      const subscription = form.watch(() => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          form.handleSubmit(onSubmit || (() => {}))()
        }, 2000)
      })

      return () => {
        subscription.unsubscribe()
        clearTimeout(timeoutId)
      }
    }
  }, [form.watch])

  useEffect(() => {
    const isDefaultValuesDifferent =
      JSON.stringify(prevDefaultValuesRef.current) !==
      JSON.stringify(defaultValues)

    if (defaultValues && isDefaultValuesDifferent) {
      prevDefaultValuesRef.current = defaultValues
      form.reset(defaultValues)
    }
  }, [defaultValues, form])

  return {
    ...form,
    onSubmit: form.handleSubmit(onSubmit || (() => {})),
  }
}
