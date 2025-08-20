import type { Organization } from '../organization/organization.interface'
import type { Membership } from '../membership/membership.interface'
import type { OrganizationMembershipRole } from '../auth'

type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'canceled'

/**
 * Represents a Invitation entity.
 */
export interface Invitation {
  /** Id's id property */
  id: string
  /** Status's status property */
  status: InvitationStatus
  /** OrganizationId's organizationId property */
  organizationId: string
  /** Related Organization entity */
  organization?: Organization
  /** Email's email property */
  email: string
  /** Role's role property */
  role: OrganizationMembershipRole
  /** InviterMembershipId's inviterMembershipId property */
  inviterMembershipId: string | null
  /** Related Membership entity */
  inviterMembership?: Membership
  /** ExpiresAt's expiresAt property */
  expiresAt: Date
  /** CreatedAt's createdAt property */
  createdAt: Date
  /** UpdatedAt's updatedAt property */
  updatedAt: Date
}

/**
 * Data transfer object for creating a new Invitation.
 */
export interface CreateInvitationDTO {
  /** Email's email property  */
  email: string
  /** Role's role property  */
  role: OrganizationMembershipRole
}

/**
 * Data transfer object for updating an existing Invitation.
 */
export interface UpdateInvitationDTO {
  /** Id's id property  */
  id?: string | null
  /** Status's status property  */
  status?: InvitationStatus | null
  /** OrganizationId's organizationId property  */
  organizationId?: string
  /** Email's email property  */
  email?: string
  /** Role's role property  */
  role?: string
  /** InviterMembershipId's inviterMembershipId property  */
  inviterMembershipId?: string | null
  /** ExpiresAt's expiresAt property  */
  expiresAt?: Date
  /** CreatedAt's createdAt property  */
  createdAt?: Date | null
  /** UpdatedAt's updatedAt property  */
  updatedAt?: Date
}

/**
 * Query parameters for fetching Category entities
 */
export interface InvitationQueryParams {
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
