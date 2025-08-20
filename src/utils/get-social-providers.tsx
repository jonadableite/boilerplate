import { socialAuthProvidersOptions } from '@/content/options/social-auth-providers'
import { auth } from '../providers/auth'

/**
 * Filters and returns the list of active social authentication providers.
 * An active provider is one whose ID exists in the auth.options.socialProviders configuration.
 *
 * @returns {SocialAuthProvider[]} Array of active social authentication provider objects
 */
export function getActiveSocialProviders() {
  return socialAuthProvidersOptions.filter((provider) => {
    return provider.id in auth.options.socialProviders
  })
}
