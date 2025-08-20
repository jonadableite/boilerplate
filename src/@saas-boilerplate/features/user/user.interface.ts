import type { DeepPartial } from '@igniter-js/core'
import { z } from 'zod'

export const UserMetadataSchema = z
  .object({
    contact: z.object({
      phone: z.string(),
    }),
    notifications: z.object({
      transactional: z.object({
        sales: z.boolean().default(true),
        reports: z.boolean().default(true),
      }),
      marketing: z.object({
        newsletter: z.boolean().default(true),
        updates: z.boolean().default(true),
      }),
    }),
    extra: z.object({
      referral_source: z.string().min(1, 'Selecione como nos conheceu'),
    }),
  })
  .deepPartial()

export type UserMetadata = z.infer<typeof UserMetadataSchema>

/**
 * Represents a User entity.
 */
export interface User {
  /** Id's id property */
  id: string
  /** Name's name property */
  name: string
  /** Email's email property */
  email: string
  /** EmailVerified's emailVerified property */
  emailVerified: boolean
  /** Image's image property */
  image: string | null
  /** CreatedAt's createdAt property */
  createdAt: Date
  /** UpdatedAt's updatedAt property */
  updatedAt: Date
  /** Role's role property */
  role: string | null
  /** Metadata's metadata property */
  metadata: UserMetadata
}

/**
 * Data transfer object for updating an existing User.
 */
export interface UpdateUserDTO {
  /** Id's id property  */
  id: string
  /** Name's name property  */
  name?: string
  /** Email's email property  */
  email?: string
  /** Image's image property  */
  image?: string | null
  /** Metadata's metadata property  */
  metadata?: DeepPartial<UserMetadata>
}

/**
 * Query parameters for fetching Category entities
 */
export interface UserQueryParams {
  /** Current page number for pagination */
  page?: number
  /** Number of items to return per page */
  limit?: number
  /** Property to sort by */
  sortBy?: string
  /** Sort order */
  sortOrder?: 'asc' | 'desc'
  /** Search term for filtering */
  search?: string
}
