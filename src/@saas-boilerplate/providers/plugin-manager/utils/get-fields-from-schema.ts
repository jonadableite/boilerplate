import { z } from 'zod'
import type { PluginField } from '../provider.interface'

export function getTypeFromZod(zodType: z.ZodTypeAny) {
  if (zodType instanceof z.ZodString) {
    if (zodType._def.checks.some((check) => check.kind === 'email')) {
      return 'email'
    }

    if (zodType._def.checks.some((check) => check.kind === 'url')) {
      return 'url'
    }

    return 'string'
  }
  if (zodType instanceof z.ZodNumber) {
    return 'number'
  }
  if (zodType instanceof z.ZodBoolean) {
    return 'boolean'
  }
  if (zodType instanceof z.ZodArray) {
    return 'array'
  }
  if (zodType instanceof z.ZodObject) {
    return 'object'
  }
  if (zodType instanceof z.ZodEnum) {
    return 'enum'
  }
  if (zodType instanceof z.ZodDate) {
    return 'date'
  }
}

export function getFieldOptionsFromZodEnum(zodEnum: z.ZodEnum<any>) {
  return zodEnum._def.values
}

export function getFieldsFromSchema(schema: z.ZodObject<any>) {
  return Object.keys(schema.shape).map((key) => ({
    name: key,
    type: getTypeFromZod(schema.shape[key]),
    placeholder: schema.shape[key]._def.description,
    required: schema.shape[key]._def.required,
    default: schema.shape[key]._def.defaultValue,
    options:
      schema.shape[key] instanceof z.ZodEnum
        ? getFieldOptionsFromZodEnum(schema.shape[key])
        : undefined,
  })) as PluginField[]
}
