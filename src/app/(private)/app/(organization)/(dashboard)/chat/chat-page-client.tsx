'use client'

import { ChatArea } from '@/features/chat/presentation/components/chat-area'
import { ChatLayout } from '@/features/chat/presentation/components/chat-layout'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

export function ChatPageClient() {
  const searchParams = useSearchParams()
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | undefined
  >()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setSelectedConversationId(searchParams.get('conversation') || undefined)
  }, [searchParams])

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId)
    // Atualizar URL sem recarregar a página
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('conversation', conversationId)
      window.history.replaceState({}, '', url.toString())
    }
  }

  if (!isClient) {
    return null
  }

  return (
    <ChatLayout
      selectedConversationId={selectedConversationId}
      onConversationSelect={handleConversationSelect}
    >
      {selectedConversationId && (
        <ChatArea conversationId={selectedConversationId} />
      )}
    </ChatLayout>
  )
}