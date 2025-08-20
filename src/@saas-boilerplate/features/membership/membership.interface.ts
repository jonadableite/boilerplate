import type { Organization } from '../organization/organization.interface'
import type { User } from '../user/user.interface'
import type { Invitation } from '../invitation/invitation.interface'

/**
 * Represents a Membership entity.
 */
export interface Membership {
  /** Id's id property */
  id: string
  /** OrganizationId's organizationId property */
  organizationId: string
  /** Related Organization entity */
  organization?: Organization
  /** UserId's userId property */
  userId: string
  /** Related User entity */
  user?: User
  /** Role's role property */
  role: string
  /** Related Invitation entities */
  invitations?: Invitation[]
  /** CreatedAt's createdAt property */
  createdAt: Date
  /** UpdatedAt's updatedAt property */
  updatedAt: Date
}

/**
 * Data transfer object for creating a new Membership.
 */
export interface CreateMembershipDTO {
  /** Id's id property  */
  id?: string | null
  /** OrganizationId's organizationId property  */
  organizationId: string
  /** UserId's userId property  */
  userId: string
  /** Role's role property  */
  role: string
  /** CreatedAt's createdAt property  */
  createdAt?: Date | null
}

/**
 * Data transfer object for updating an existing Membership.
 */
export interface UpdateMembershipDTO {
  /** Id's id property  */
  id?: string | null
  /** OrganizationId's organizationId property  */
  organizationId?: string
  /** UserId's userId property  */
  userId?: string
  /** Role's role property  */
  role?: string
}

/**
 * Query parameters for fetching Membership entities
 */
export interface MembershipQueryParams {
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
  /** OrganizationId filter */
  organizationId?: string
}
