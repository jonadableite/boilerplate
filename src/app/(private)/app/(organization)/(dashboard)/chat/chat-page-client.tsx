'use client'

import { ChatArea } from '@/features/chat/presentation/components/chat-area'
import { ChatLayout } from '@/features/chat/presentation/components/chat-layout'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

export function ChatPageClient() {
  const searchParams = useSearchParams()
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(
    searchParams.get('conversation') || undefined
  )

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversationId(conversationId)
    // Atualizar URL sem recarregar a página
    const url = new URL(window.location.href)
    url.searchParams.set('conversation', conversationId)
    window.history.replaceState({}, '', url.toString())
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