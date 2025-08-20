import type { Organization } from '@/@saas-boilerplate/features/organization'
import type { Lead } from '../lead/lead.interface'

export type SubmissionMetadata = {
  source?: string
  data: Record<string, any>
}

/**
 * Represents a Submissions entity.
 */
export interface Submission {
  /** Id's id property */
  id: string
  /** Metadata's metadata property */
  metadata: SubmissionMetadata
  /** LeadId's leadId property */
  leadId: string
  /** Related Lead entity */
  lead?: Lead
  /** OrganizationId's organizationId property */
  organizationId: string
  /** Related Organization entity */
  organization?: Organization
  /** CreatedAt's createdAt property */
  createdAt: Date
  /** UpdatedAt's updatedAt property */
  updatedAt: Date
}

/**
 * Data transfer object for creating a new Submissions.
 */
export interface CreateSubmissionsDTO {
  /** Name's name property  */
  name?: string
  /** Phone's phone property  */
  phone?: string
  /** Email's email property  */
  email: string
  /** Metadata's metadata property  */
  metadata?: SubmissionMetadata
  /** OrganizationId's organizationId property  */
  organizationId: string
}

/**
 * Data transfer object for updating an existing Submissions.
 */
export interface UpdateSubmissionsDTO {
  /** Id's id property  */
  id: string
  /** Metadata's metadata property  */
  metadata: SubmissionMetadata
  /** LeadId's leadId property  */
  leadId?: string
  /** OrganizationId's organizationId property  */
  organizationId: string
}

/**
 * Query parameters for fetching Category entities
 */
export interface SubmissionsQueryParams {
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
  /** OrganizationId's organizationId property */
  organizationId?: string
  /** Filter by leadId */
  leadId?: string
}
