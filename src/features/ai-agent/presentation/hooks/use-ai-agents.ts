'use client'

import { useCallback } from 'react'
import { api } from '@/igniter.client'

export interface UseAIAgentsReturn {
  agents: any[]
  loading: boolean
  error: string | null
  fetchAgents: () => void
  createAgent: (data: any) => Promise<void>
  updateAgent: (id: string, data: any) => Promise<void>
  deleteAgent: (id: string) => Promise<void>
  getAgentById: (id: string) => any | undefined
  refreshAgents: () => void
}

export function useAIAgents(): UseAIAgentsReturn {
  // Use IgniterJS useQuery hook for fetching agents
  const agentsQuery = api.aiAgents.fetchAgents.useQuery()

  const agents = agentsQuery.data?.agents || []
  const loading = agentsQuery.loading
  const error = agentsQuery.error ? 'Erro ao buscar agentes' : null

  // Fetch agents function (triggers refetch)
  const fetchAgents = useCallback(() => {
    agentsQuery.refetch()
  }, [agentsQuery])

  // Create agent function
  const createAgent = useCallback(
    async (data: any) => {
      try {
        await api.aiAgents.createAgent.mutate({
          body: data,
        })
        agentsQuery.refetch() // Refresh the list after creation
      } catch (err) {
        console.error('[useAIAgents] Erro ao criar agente:', err)
        throw err
      }
    },
    [agentsQuery],
  )

  // Update agent function
  const updateAgent = useCallback(
    async (id: string, data: any) => {
      try {
        await api.aiAgents.updateAgent.mutate({
          params: { agentId: id },
          body: data,
        })
        agentsQuery.refetch() // Refresh the list after update
      } catch (err) {
        console.error('[useAIAgents] Erro ao atualizar agente:', err)
        throw err
      }
    },
    [agentsQuery.refetch],
  )

  // Delete agent function
  const deleteAgent = useCallback(
    async (id: string) => {
      try {
        await api.aiAgents.deleteAgent.mutate({ params: { agentId: id } })
        agentsQuery.refetch() // Refresh the list after deletion
      } catch (err) {
        console.error('[useAIAgents] Erro ao deletar agente:', err)
        throw err
      }
    },
    [agentsQuery.refetch],
  )

  // Get agent by ID
  const getAgentById = useCallback(
    (id: string) => {
      return agents.find((agent: any) => agent.id === id)
    },
    [agents],
  )

  // Refresh agents (alias for fetchAgents)
  const refreshAgents = useCallback(() => {
    agentsQuery.refetch()
  }, [agentsQuery])

  return {
    agents,
    loading,
    error,
    fetchAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    getAgentById,
    refreshAgents,
  }
}
