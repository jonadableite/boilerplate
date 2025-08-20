import type { Organization } from '../organization/organization.interface'

/**
 * Represents a ApiKey entity.
 */
export interface ApiKey {
  /** Id's id property */
  id: string
  /** Description's description property */
  description: string
  /** Key's key property */
  key: string
  /** Enabled's enabled property */
  enabled: boolean
  /** NeverExpires's neverExpires property */
  neverExpires: boolean
  /** ExpiresAt's expiresAt property */
  expiresAt: Date | null
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
 * Data transfer object for creating a new ApiKey.
 */
export interface CreateApiKeyDTO {
  /** Description's description property  */
  description: string
  /** NeverExpires's neverExpires property  */
  neverExpires?: boolean | null
  /** ExpiresAt's expiresAt property  */
  expiresAt?: Date | null
  /** OrganizationId's organizationId property  */
  organizationId: string
}

/**
 * Data transfer object for updating an existing ApiKey.
 */
export interface UpdateApiKeyDTO {
  /** Id's id property  */
  id: string
  /** Description's description property  */
  description?: string
  /** Enabled's enabled property  */
  enabled?: boolean
  /** NeverExpires's neverExpires property  */
  neverExpires?: boolean | null
  /** ExpiresAt's expiresAt property  */
  expiresAt?: Date | null
  /** OrganizationId's organizationId property  */
  organizationId?: string
  /** CreatedAt's createdAt property  */
  createdAt?: Date | null
  /** UpdatedAt's updatedAt property  */
  updatedAt?: Date
}

/**
 * Query parameters for fetching Category entities
 */
export interface ApiKeyQueryParams {
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
