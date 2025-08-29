import { igniter } from '@/igniter.server'
import { AIAgentService } from '../services/ai-agent.service'
import { VoiceProcessingService } from '../services/voice-processing.service'
import { getAIAgentConfig } from '../config/ai-agent.config'
import { SpeechModel, TTSModel, TTSVoice } from '../ai-agent.types'

export const AIAgentFeatureProcedure = igniter.procedure({
  name: 'AIAgentFeatureProcedure',
  handler: async (_, { context }) => {
    const config = getAIAgentConfig()

    // Inicializar serviços
    const aiAgentService = new AIAgentService(
      config.evolution.baseURL,
      config.evolution.apiKey,
      config.evolution.defaultInstance,
      config.openai.apiKey,
    )

    const voiceProcessingService = new VoiceProcessingService(
      config.openai.apiKey,
    )

    return {
      aiAgent: {
        // Métodos de gerenciamento de agentes
        createAgent: async (input: any) => {
          return aiAgentService.createAgent(input)
        },

        updateAgent: async (input: any) => {
          return aiAgentService.updateAgent(input)
        },

        deleteAgent: async (input: any) => {
          return aiAgentService.deleteAgent(input)
        },

        getAgentById: async (id: string) => {
          return aiAgentService.getAgentById(id)
        },

        fetchAgents: async (input: any) => {
          return aiAgentService.fetchAgents(input)
        },

        // Métodos de gerenciamento de sessões
        changeSessionStatus: async (input: any) => {
          return aiAgentService.changeSessionStatus(input)
        },

        fetchSessions: async (input: any) => {
          return aiAgentService.fetchSessions(input)
        },

        // Métodos de configuração
        createOpenAICreds: async (input: any) => {
          return aiAgentService.createOpenAICreds(input)
        },

        getOpenAICreds: async (input: any) => {
          return aiAgentService.getOpenAICreds(input)
        },

        setDefaultSettings: async (input: any) => {
          return aiAgentService.setDefaultSettings(input)
        },

        fetchDefaultSettings: async (input: any) => {
          return aiAgentService.fetchDefaultSettings(input)
        },

        // Métodos de processamento de mensagens
        processMessage: async (input: any) => {
          return aiAgentService.processMessage(input.agentId, {
            remoteJid: input.remoteJid,
            message: input.message,
            type: input.type,
            audioUrl: input.audioUrl,
            metadata: input.metadata,
            organizationId: input.organizationId,
            userId: input.userId,
          })
        },

        // Métodos de base de conhecimento
        uploadKnowledge: async (input: any) => {
          return aiAgentService.uploadKnowledge(input)
        },

        // Métodos de processamento de voz
        transcribeAudio: async (input: {
          audioUrl: string
          model?: SpeechModel
          language?: string
        }) => {
          return voiceProcessingService.transcribeFromUrl(input.audioUrl, {
            model: input.model,
            language: input.language,
          })
        },

        transcribeAudioFile: async (
          audioFile: File,
          options?: {
            agentId?: string
            model?: SpeechModel
            language?: string
          },
        ) => {
          const audioBlob = new Blob([await audioFile.arrayBuffer()], {
            type: audioFile.type,
          })
          return voiceProcessingService.transcribeAudio(audioBlob, {
            model: options?.model,
            language: options?.language,
          })
        },

        generateSpeech: async (input: {
          text: string
          agentId: string
          model?: TTSModel
          voice?: TTSVoice
          language?: string
        }) => {
          return voiceProcessingService.textToSpeech(input.text, {
            model: input.model,
            voice: input.voice,
            language: input.language,
          })
        },

        processAudioMessage: async (
          audioFile: File,
          options?: {
            agentId: string
            language?: string
          },
        ) => {
          if (!options?.agentId) {
            throw new Error('ID do agente é obrigatório')
          }

          // Converter File para Blob
          const audioBlob = new Blob([await audioFile.arrayBuffer()], {
            type: audioFile.type,
          })

          // Transcrever áudio
          const transcription = await voiceProcessingService.transcribeAudio(
            audioBlob,
            {
              language: options.language,
            },
          )

          // Processar mensagem com o texto transcrito
          const response = await aiAgentService.processMessage(
            options.agentId,
            {
              remoteJid: 'web-client',
              message: transcription,
              type: 'text',
              metadata: { source: 'audio' },
              organizationId: 'web-client',
              userId: 'web-client',
            },
          )

          // Gerar áudio da resposta
          const audioUrl = await voiceProcessingService.textToSpeech(
            response.message,
            {
              language: options.language,
            },
          )

          return {
            success: true,
            transcription,
            message: response.message,
            audioUrl,
          }
        },
      },
    }
  },
})

export default AIAgentFeatureProcedure
