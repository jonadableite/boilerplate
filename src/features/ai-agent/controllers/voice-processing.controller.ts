import { igniter } from '@/igniter'
import { z } from 'zod'
import { AuthFeatureProcedure } from '@/@saas-boilerplate/features/auth'
import { AIAgentFeatureProcedure } from '../procedures/ai-agent.procedure'
import { SpeechModel, TTSModel, TTSVoice } from '../ai-agent.types'

/**
 * Controlador para processamento de voz (STT e TTS)
 */
export const VoiceProcessingController = igniter.controller({
  name: 'voice-processing',
  path: '/voice-processing',
  actions: {
    // Transcrever áudio (STT)
    transcribeAudio: igniter.mutation({
      method: 'POST',
      path: '/transcribe',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      body: z.object({
        audioUrl: z.string().url().optional(),
        model: z.nativeEnum(SpeechModel).optional(),
        language: z.string().optional(),
      }),
      handler: async ({ request, response, context }) => {
        // Verificar autenticação
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session) {
          return response.unauthorized('Autenticação necessária')
        }

        try {
          const result = await context.aiAgent.transcribeAudio(request.body)
          return response.success(result)
        } catch (error) {
          console.error('Erro ao transcrever áudio:', error)
          return response.error('Erro ao transcrever áudio')
        }
      },
    }),

    // Transcrever áudio de arquivo (STT)
    transcribeAudioFile: igniter.mutation({
      method: 'POST',
      path: '/transcribe-file',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      body: z.object({
        agentId: z.string(),
        language: z.string().optional(),
      }),
      handler: async ({ request, response, context }) => {
        // Verificar autenticação
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session) {
          return response.unauthorized('Autenticação necessária')
        }

        try {
          // Obter o arquivo de áudio do request
          const formData = await request.formData()
          const audioFile = formData.get('audio') as File
          
          if (!audioFile) {
            return response.badRequest('Arquivo de áudio não fornecido')
          }

          // Processar o áudio
          const result = await context.aiAgent.transcribeAudioFile(audioFile, {
            agentId: request.body.agentId,
            language: request.body.language,
          })

          return response.success(result)
        } catch (error) {
          console.error('Erro ao transcrever arquivo de áudio:', error)
          return response.error('Erro ao transcrever arquivo de áudio')
        }
      },
    }),

    // Gerar áudio a partir de texto (TTS)
    generateSpeech: igniter.mutation({
      method: 'POST',
      path: '/generate-speech',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      body: z.object({
        text: z.string(),
        agentId: z.string(),
        model: z.nativeEnum(TTSModel).optional(),
        voice: z.nativeEnum(TTSVoice).optional(),
        language: z.string().optional(),
      }),
      handler: async ({ request, response, context }) => {
        // Verificar autenticação
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session) {
          return response.unauthorized('Autenticação necessária')
        }

        try {
          const result = await context.aiAgent.generateSpeech(request.body)
          return response.success(result)
        } catch (error) {
          console.error('Erro ao gerar áudio:', error)
          return response.error('Erro ao gerar áudio')
        }
      },
    }),

    // Processar mensagem de áudio (STT + processamento + TTS)
    processAudioMessage: igniter.mutation({
      method: 'POST',
      path: '/process-audio-message',
      use: [AuthFeatureProcedure(), AIAgentFeatureProcedure()],
      body: z.object({
        agentId: z.string(),
        language: z.string().optional(),
      }),
      handler: async ({ request, response, context }) => {
        // Verificar autenticação
        const session = await context.auth.getSession({
          requirements: 'authenticated',
        })

        if (!session) {
          return response.unauthorized('Autenticação necessária')
        }

        try {
          // Obter o arquivo de áudio do request
          const formData = await request.formData()
          const audioFile = formData.get('audio') as File
          
          if (!audioFile) {
            return response.badRequest('Arquivo de áudio não fornecido')
          }

          // Processar a mensagem de áudio
          const result = await context.aiAgent.processAudioMessage(audioFile, {
            agentId: request.body.agentId,
            language: request.body.language,
          })

          return response.success(result)
        } catch (error) {
          console.error('Erro ao processar mensagem de áudio:', error)
          return response.error('Erro ao processar mensagem de áudio')
        }
      },
    }),
  },
})

export default VoiceProcessingController