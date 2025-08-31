import { igniter } from '@/igniter'
import { AIAgentService } from '../services/ai-agent.service'
import { VoiceProcessingService } from '../services/voice-processing.service'
import { OpenAIService } from '../services/openai.service'
import { getAIAgentConfig } from '../config/ai-agent.config'
import { SpeechModel, TTSModel, TTSVoice } from '../ai-agent.types'

export const AIAgentFeatureProcedure = igniter.procedure({
  name: 'AIAgentFeatureProcedure',
  handler: async (_, { context }) => {
    try {
      console.log('[AIAgentFeatureProcedure] Inicializando procedure')
      const config = getAIAgentConfig()

      console.log('[AIAgentFeatureProcedure] Configuração obtida:', {
        hasOpenAIKey: !!config.openai.apiKey,
        hasEvolutionURL: !!config.evolution.baseURL,
        hasEvolutionKey: !!config.evolution.apiKey,
      })

      // Inicializar serviços com contexto
      const aiAgentService = new AIAgentService(
        config.evolution.baseURL,
        config.evolution.apiKey,
        config.evolution.defaultInstance,
        config.openai.apiKey,
        context,
      )

      const openaiService = new OpenAIService(config.openai.apiKey)
      const voiceProcessingService = new VoiceProcessingService(openaiService)

      console.log(
        '[AIAgentFeatureProcedure] Serviços inicializados com sucesso',
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
            const audioBuffer = Buffer.from(await audioFile.arrayBuffer())
            return voiceProcessingService.transcribeAudio({
              file: audioBuffer,
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
            return voiceProcessingService.textToSpeech({
              text: input.text,
              model: input.model,
              voice: input.voice,
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

            // Converter File para Buffer
            const audioBuffer = Buffer.from(await audioFile.arrayBuffer())

            // Transcrever áudio
            const transcriptionResult =
              await voiceProcessingService.transcribeAudio({
                file: audioBuffer,
                language: options.language,
              })

            if (!transcriptionResult.success || !transcriptionResult.data) {
              throw new Error('Falha na transcrição do áudio')
            }

            const transcription = transcriptionResult.data

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
            const audioResult = await voiceProcessingService.textToSpeech({
              text: response.message,
            })

            if (!audioResult.success || !audioResult.data) {
              throw new Error('Falha na geração do áudio')
            }

            return {
              success: true,
              transcription,
              message: response.message,
              audioBuffer: audioResult.data,
            }
          },
        },
      }
    } catch (error) {
      console.error('[AIAgentFeatureProcedure] Erro na inicialização:', error)
      throw error
    }
  },
})

export default AIAgentFeatureProcedure
