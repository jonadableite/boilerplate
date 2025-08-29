'use client'

import { useState, useCallback } from 'react'
import { api } from '@/igniter.client'

interface UseVoiceProcessingOptions {
  agentId: string
  language?: string
  onTranscriptionComplete?: (text: string) => void
  onResponseAudioReady?: (audioUrl: string) => void
  onError?: (error: Error) => void
}

/**
 * Hook para gerenciar processamento de voz (STT e TTS) no frontend
 */
export const useVoiceProcessing = ({
  agentId,
  language = 'pt-BR',
  onTranscriptionComplete,
  onResponseAudioReady,
  onError,
}: UseVoiceProcessingOptions) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcription, setTranscription] = useState('')
  const [responseAudioUrl, setResponseAudioUrl] = useState('')
  const [error, setError] = useState<Error | null>(null)

  /**
   * Processa um arquivo de áudio e obtém a resposta do agente
   */
  const processAudioMessage = useCallback(async (audioBlob: Blob) => {
    try {
      setIsProcessing(true)
      setError(null)

      // Criar um FormData para enviar o arquivo de áudio
      const formData = new FormData()
      formData.append('audio', audioBlob, 'audio.webm')
      formData.append('agentId', agentId)
      formData.append('language', language)

      // Enviar o áudio para processamento
      const response = await api.aiAgent.processAudioMessage.mutate(formData)

      // Atualizar estado com a transcrição
      if (response.transcription) {
        setTranscription(response.transcription)
        onTranscriptionComplete?.(response.transcription)
      }

      // Atualizar estado com a URL do áudio de resposta
      if (response.audioUrl) {
        setResponseAudioUrl(response.audioUrl)
        onResponseAudioReady?.(response.audioUrl)
      }

      return response
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao processar mensagem de áudio')
      setError(error)
      onError?.(error)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }, [agentId, language, onTranscriptionComplete, onResponseAudioReady, onError])

  /**
   * Gera áudio a partir de texto
   */
  const generateSpeech = useCallback(async (text: string) => {
    try {
      setIsProcessing(true)
      setError(null)

      // Chamar a API para gerar áudio
      const response = await api.aiAgent.generateSpeech.mutate({
        text,
        agentId,
        language,
      })

      // Atualizar estado com a URL do áudio
      if (response.audioUrl) {
        setResponseAudioUrl(response.audioUrl)
        onResponseAudioReady?.(response.audioUrl)
      }

      return response.audioUrl
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao gerar áudio')
      setError(error)
      onError?.(error)
      throw error
    } finally {
      setIsProcessing(false)
    }
  }, [agentId, language, onResponseAudioReady, onError])

  /**
   * Transcreve áudio em tempo real usando a API Web Speech
   */
  const transcribeRealTime = useCallback((text: string) => {
    setTranscription(text)
    onTranscriptionComplete?.(text)
  }, [onTranscriptionComplete])

  /**
   * Limpa os estados
   */
  const reset = useCallback(() => {
    setTranscription('')
    setResponseAudioUrl('')
    setError(null)
    setIsProcessing(false)
  }, [])

  return {
    isProcessing,
    transcription,
    responseAudioUrl,
    error,
    processAudioMessage,
    generateSpeech,
    transcribeRealTime,
    reset,
  }
}

export default useVoiceProcessing