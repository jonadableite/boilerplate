import type { Organization } from '../organization/organization.interface'

/**
 * Represents a Webhook entity.
 */
export interface Webhook {
  /** Id's id property */
  id: string
  /** Url's url property */
  url: string
  /** Secret's secret property */
  secret: string
  /** Events's events property */
  events: string[]
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
 * Data transfer object for creating a new Webhook.
 */
export interface CreateWebhookDTO {
  /** Url's url property  */
  url: string
  /** Secret's secret property  */
  secret: string
  /** Array of IDs for the String relationships to be created */
  events: string[]
  /** OrganizationId's organizationId property  */
  organizationId: string
}

/**
 * Data transfer object for updating an existing Webhook.
 */
export interface UpdateWebhookDTO {
  /** Id's id property  */
  id: string
  /** OrganizationId's organizationId property  */
  organizationId?: string
  /** Url's url property  */
  url?: string
  /** Secret's secret property  */
  secret?: string
  /** Array of events */
  events?: string[]
}
