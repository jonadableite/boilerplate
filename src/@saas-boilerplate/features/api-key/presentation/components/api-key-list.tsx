'use client'

import { Lists } from '@/components/ui/lists'
import { Key, KeyIcon } from 'lucide-react'
import { Annotated } from '@/components/ui/annotated'
import { AnimatedEmptyState } from '@/components/ui/animated-empty-state'

interface ApiKey {
  id: string
  description: string
  expiresAt?: Date | null
  key: string
}

interface ApiKeyListProps {
  apiKeys: ApiKey[]
}

export function ApiKeyList({ apiKeys }: ApiKeyListProps) {
  return (
    <Annotated>
      <Annotated.Sidebar>
        <Annotated.Icon>
          <Key className="h-4 w-4" />
        </Annotated.Icon>
        <Annotated.Title>API Keys</Annotated.Title>
        <Annotated.Description>
          Manage your API keys for integration with external services.
        </Annotated.Description>
      </Annotated.Sidebar>
      <Annotated.Content>
        <Annotated.Section>
          <Lists.Root data={apiKeys} searchFields={['description']}>
            <Lists.SearchBar />
            <Lists.Content>
              {({ data }) =>
                data.length === 0 ? (
                  <AnimatedEmptyState>
                    <AnimatedEmptyState.Carousel>
                      <KeyIcon className="size-6" />
                      <span className="bg-secondary h-3 w-[16rem] rounded-full"></span>
                    </AnimatedEmptyState.Carousel>

                    <AnimatedEmptyState.Content>
                      <AnimatedEmptyState.Title>
                        No API keys found
                      </AnimatedEmptyState.Title>
                      <AnimatedEmptyState.Description>
                        API key is configured in environment variables.
                      </AnimatedEmptyState.Description>
                    </AnimatedEmptyState.Content>
                  </AnimatedEmptyState>
                ) : (
                  <>
                    {data.map((apiKey: ApiKey) => (
                      <Lists.Item key={apiKey.id}>
                        <div className="flex items-center justify-between p-4">
                          <div className="space-y-1">
                            <p className="font-semibold text-sm">
                              {apiKey.description}
                            </p>
                            <div className="flex items-center justify-center space-x-4">
                              <p className="text-sm text-muted-foreground">
                                {apiKey.key}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {apiKey.expiresAt
                                  ? `Expires on ${apiKey.expiresAt.toLocaleDateString()}`
                                  : 'Never expires'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </Lists.Item>
                    ))}
                  </>
                )
              }
            </Lists.Content>
          </Lists.Root>
        </Annotated.Section>
      </Annotated.Content>
    </Annotated>
  )
}
