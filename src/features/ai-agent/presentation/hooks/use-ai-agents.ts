'use client'

import { useCallback, useEffect, useState } from 'react'
import { AIAgent, CreateAgentInput, UpdateAgentInput } from '../../ai-agent.types'

interface UseAIAgentsReturn {
  agents: AIAgent[]
  loading: boolean
  error: string | null
  createAgent: (input: CreateAgentInput) => Promise<AIAgent | null>
  updateAgent: (id: string, input: UpdateAgentInput) => Promise<AIAgent | null>
  deleteAgent: (id: string) => Promise<boolean>
  refreshAgents: () => Promise<void>
  getAgentById: (id: string) => AIAgent | undefined
}

export function useAIAgents(): UseAIAgentsReturn {
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Buscar agentes
  const fetchAgents = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/ai-agents')
      if (!response.ok) {
        throw new Error('Falha ao buscar agentes')
      }

      const data = await response.json()
      if (data.success) {
        setAgents(data.data || [])
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('[useAIAgents] Erro ao buscar agentes:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Criar agente
  const createAgent = useCallback(async (input: CreateAgentInput): Promise<AIAgent | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/ai-agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        throw new Error('Falha ao criar agente')
      }

      const data = await response.json()
      if (data.success) {
        const newAgent = data.data
        setAgents(prev => [...prev, newAgent])
        return newAgent
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('[useAIAgents] Erro ao criar agente:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Atualizar agente
  const updateAgent = useCallback(async (id: string, input: UpdateAgentInput): Promise<AIAgent | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/ai-agents/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        throw new Error('Falha ao atualizar agente')
      }

      const data = await response.json()
      if (data.success) {
        const updatedAgent = data.data
        setAgents(prev => prev.map(agent =>
          agent.id === id ? updatedAgent : agent
        ))
        return updatedAgent
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('[useAIAgents] Erro ao atualizar agente:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Deletar agente
  const deleteAgent = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/ai-agents/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Falha ao deletar agente')
      }

      const data = await response.json()
      if (data.success) {
        setAgents(prev => prev.filter(agent => agent.id !== id))
        return true
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('[useAIAgents] Erro ao deletar agente:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Buscar agente por ID
  const getAgentById = useCallback((id: string): AIAgent | undefined => {
    return agents.find(agent => agent.id === id)
  }, [agents])

  // Refresh agentes
  const refreshAgents = useCallback(async () => {
    await fetchAgents()
  }, [fetchAgents])

  // Carregar agentes na inicialização
  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  return {
    agents,
    loading,
    error,
    createAgent,
    updateAgent,
    deleteAgent,
    refreshAgents,
    getAgentById,
  }
}