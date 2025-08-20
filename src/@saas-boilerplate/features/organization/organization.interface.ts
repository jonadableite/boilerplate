import type { plugins } from '@/providers/plugin-manager'
import { z } from 'zod'

export const OrganizationMetadataSchema = z
  .object({
    options: z.object({
      has_demo_data: z.boolean().default(false),
    }),
    contact: z.object({
      email: z.string().email('Email inválido').optional(),
    }),
    links: z.object({
      website: z.string().url('URL inválida').optional(),
      linkedin: z.string().url('URL inválida').optional(),
      instagram: z.string().url('URL inválida').optional(),
      youtube: z.string().url('URL inválida').optional(),
      twitter: z.string().url('URL inválida').optional(),
      tiktok: z.string().url('URL inválida').optional(),
      facebook: z.string().url('URL inválida').optional(),
    }),
  })
  .deepPartial()

export type OrganizationMetadata = z.infer<typeof OrganizationMetadataSchema>

/**
 * Represents a Organization entity.
 */
export interface Organization {
  /** Id's id property */
  id: string
  /** Name's name property */
  name: string
  /** Slug's slug property */
  slug: string
  /** Logo's logo property */
  logo: string | null | undefined
  /** Metadata's metadata property */
  metadata: OrganizationMetadata
  /** Plugins configuration */
  integrations?: Partial<typeof plugins.$Infer.Config>
}

/**
 * Data transfer object for creating a new Organization.
 */
export interface CreateOrganizationDTO {
  withDemoData?: boolean
  /** Id's id property  */
  id?: string | null
  /** UserId's userId property  */
  userId: string
  /** Name's name property  */
  name: string
  /** Slug's slug property  */
  slug: string
  /** Logo's logo property  */
  logo?: string
  /** Metadata's metadata property  */
  metadata: OrganizationMetadata
}

/**
 * Data transfer object for updating an existing Organization.
 */
export interface UpdateOrganizationDTO {
  /** Id's id property  */
  id: string
  /** Name's name property  */
  name?: string
  /** Slug's slug property  */
  slug?: string
  /** Logo's logo property  */
  logo?: string | null
  /** Metadata's metadata property  */
  metadata?: Partial<OrganizationMetadata> | null
}
