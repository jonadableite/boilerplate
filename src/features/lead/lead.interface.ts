import type { Organization } from '@/@saas-boilerplate/features/organization'
import type { Submission } from '../submission'

/**
 * Represents a Lead entity.
 */
export interface Lead {
  /** Id's id property */
  id: string
  /** Email's email property */
  email: string
  /** Name's name property */
  name: string | null
  /** Phone's phone property */
  phone: string | null
  /** Metadata's metadata property */
  metadata: Record<string, string | number | boolean> | null
  /** Related Submissions entities */
  submissions?: Submission[]
  /** CreatedAt's createdAt property */
  createdAt: Date
  /** UpdatedAt's updatedAt property */
  updatedAt: Date
  /** OrganizationId's organizationId property */
  organizationId: string
  /** Related Organization entity */
  organization?: Organization
}

/**
 * Data transfer object for creating a new Lead.
 */
export interface CreateLeadDTO {
  /** Email's email property  */
  email: string
  /** Name's name property  */
  name?: string | null
  /** Phone's phone property  */
  phone?: string | null
  /** Metadata's metadata property  */
  metadata?: Record<string, string | number | boolean> | null
  /** OrganizationId's organizationId property  */
  organizationId: string
}

/**
 * Data transfer object for updating an existing Lead.
 */
export interface UpdateLeadDTO {
  /** Email's email property  */
  email?: string
  /** Name's name property  */
  name?: string | null
  /** Phone's phone property  */
  phone?: string | null
  /** Metadata's metadata property  */
  metadata?: Record<string, string | number | boolean> | null
}

/**
 * Query parameters for fetching Category entities
 */
export interface LeadQueryParams {
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
  /** Filter by organizationId */
  organizationId: string
}
