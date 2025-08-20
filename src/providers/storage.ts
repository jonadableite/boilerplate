import { CompatibleS3StorageAdapter } from '@/@saas-boilerplate/providers/storage/adapters/compatible-s3-storage.adapter'
import { AppConfig } from '@/boilerplate.config'
import { StorageProvider } from '@/@saas-boilerplate/providers/storage'

export const storage = StorageProvider.initialize({
  adapter: CompatibleS3StorageAdapter,
  credentials: AppConfig.providers.storage,
  contexts: ['user', 'organization', 'public'] as const,
})
