'use client'

import { Lists } from '@/components/ui/lists'
import { Button } from '@/components/ui/button'
import { Key, KeyIcon, PlusSquare, Trash } from 'lucide-react'
import { toast } from 'sonner'
import { Annotated } from '@/components/ui/annotated'
import { useState } from 'react'
import { CreateApiKeyModal } from './upsert-api-key-dialog'
import { api } from '@/igniter.client'
import { useRouter } from 'next/navigation'
import { AnimatedEmptyState } from '@/components/ui/animated-empty-state'

interface ApiKey {
  id: string
  description: string
  expiresAt?: Date | null
  key: string
}

interface ApiKeyListProps {
  apiKeys: ApiKey[]
  onDelete?: (id: string) => Promise<void>
}

export function ApiKeyList({ apiKeys, onDelete }: ApiKeyListProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleDelete = async (id: string) => {
    try {
      if (!window.confirm('Are you sure you want to remove this API key?'))
        return
      await api.apiKey.delete.mutate({ params: { id } })
      await onDelete?.(id)
      toast.success('API key removed successfully')
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Failed to remove the API key')
    }
  }

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
                        You haven't created any API keys yet.
                      </AnimatedEmptyState.Description>
                    </AnimatedEmptyState.Content>

                    <AnimatedEmptyState.Actions>
                      <AnimatedEmptyState.Action
                        onClick={() => setIsModalOpen(true)}
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Create API key
                      </AnimatedEmptyState.Action>
                    </AnimatedEmptyState.Actions>
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

                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(apiKey.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </Lists.Item>
                    ))}

                    <div className="pt-2">
                      <Button
                        variant="link"
                        onClick={() => setIsModalOpen(true)}
                      >
                        <PlusSquare className="h-4 w-4 mr-2" />
                        Create API key
                      </Button>
                    </div>
                  </>
                )
              }
            </Lists.Content>
          </Lists.Root>

          <CreateApiKeyModal open={isModalOpen} onOpenChange={setIsModalOpen} />
        </Annotated.Section>
      </Annotated.Content>
    </Annotated>
  )
}
