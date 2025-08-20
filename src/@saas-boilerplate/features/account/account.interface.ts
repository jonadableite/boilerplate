export enum AccountProvider {
  GITHUB = 'github',
  APPLE = 'apple',
  DISCORD = 'discord',
  FACEBOOK = 'facebook',
  MICROSOFT = 'microsoft',
  GOOGLE = 'google',
  SPOTIFY = 'spotify',
  TWITCH = 'twitch',
  TWITTER = 'twitter',
  DROPBOX = 'dropbox',
  LINKEDIN = 'linkedin',
  GITLAB = 'gitlab',
  REDDIT = 'reddit',
}

/**
 * Represents a Account entity.
 */
export interface Account {
  // Id's id property
  id: string
  // ProviderId's providerId property
  provider: string
  // UserId's userId property
  createdAt: Date
  // AccessToken's accessToken property
  updatedAt: Date
  // RefreshToken's refreshToken property
  accountId: string
}

/**
 * Data transfer object for creating a new Account.
 */
export interface LinkAccountDTO {
  provider: AccountProvider
  callbackURL: string
}

export interface LinkAccountResponse {
  url: string
  redirect: boolean
}

/**
 * Data transfer object for creating a new Account.
 */
export interface UnlinkAccountDTO {
  provider: AccountProvider
}
