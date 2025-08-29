import { SpeechModel, TTSModel, TTSVoice } from '../ai-agent.types'
import { OpenAIService, SpeechRequest, TranscriptionRequest } from './openai.service'
import { EvolutionAPIClient } from './evolution-api.client'

// Interfaces para o serviço de processamento de voz
export interface AudioTranscriptionOptions {
  file: File | Buffer
  model?: SpeechModel
  language?: string
  prompt?: string
  temperature?: number
}

export interface TextToSpeechOptions {
  text: string
  model?: TTSModel
  voice?: TTSVoice
  speed?: number
  responseFormat?: 'mp3' | 'opus' | 'aac' | 'flac'
}

export interface VoiceProcessingResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Serviço para processamento de voz (Speech-to-Text e Text-to-Speech)
 * Integra as APIs da OpenAI e Evolution API para transcrição de áudio e síntese de voz
 */
export class VoiceProcessingService {
  private openaiService: OpenAIService
  private evolutionClient?: EvolutionAPIClient

  constructor(openaiService: OpenAIService, evolutionClient?: EvolutionAPIClient) {
    this.openaiService = openaiService
    this.evolutionClient = evolutionClient
  }

  /**
   * Transcreve áudio para texto usando o modelo especificado
   * @param options Opções de transcrição
   * @returns Resultado da transcrição
   */
  async transcribeAudio(options: AudioTranscriptionOptions): Promise<VoiceProcessingResult<string>> {
    try {
      // Configurar requisição para o serviço OpenAI
      const request: TranscriptionRequest = {
        file: options.file,
        model: options.model || SpeechModel.WHISPER_1,
        language: options.language,
        prompt: options.prompt,
        temperature: options.temperature,
      }

      // Transcrever áudio usando OpenAI
      const transcription = await this.openaiService.transcribeAudio(request)
      
      return {
        success: true,
        data: transcription
      }
    } catch (error) {
      console.error('[Voice Processing Service] Erro ao transcrever áudio:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido na transcrição'
      }
    }
  }

  /**
   * Transcreve áudio a partir de uma URL
   * @param audioUrl URL do arquivo de áudio
   * @param options Opções de transcrição
   * @returns Resultado da transcrição
   */
  async transcribeFromUrl(audioUrl: string, options: Omit<AudioTranscriptionOptions, 'file'>): Promise<VoiceProcessingResult<string>> {
    try {
      // Baixar o arquivo de áudio
      const audioBuffer = await this.downloadAudio(audioUrl)
      
      // Transcrever o áudio baixado
      return await this.transcribeAudio({
        ...options,
        file: audioBuffer
      })
    } catch (error) {
      console.error('[Voice Processing Service] Erro ao transcrever áudio da URL:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao processar áudio da URL'
      }
    }
  }

  /**
   * Gera áudio a partir de texto usando o modelo especificado
   * @param options Opções de síntese de voz
   * @returns Buffer contendo o áudio gerado
   */
  async textToSpeech(options: TextToSpeechOptions): Promise<VoiceProcessingResult<Buffer>> {
    try {
      // Configurar requisição para o serviço OpenAI
      const request: SpeechRequest = {
        model: options.model || TTSModel.TTS_1,
        input: options.text,
        voice: options.voice || TTSVoice.ALLOY,
        response_format: options.responseFormat,
        speed: options.speed
      }

      // Gerar áudio usando OpenAI
      const audioBuffer = await this.openaiService.generateSpeech(request)
      
      return {
        success: true,
        data: audioBuffer
      }
    } catch (error) {
      console.error('[Voice Processing Service] Erro ao gerar áudio:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido na geração de áudio'
      }
    }
  }

  /**
   * Tenta transcrever áudio usando a Evolution API (fallback)
   * @param audioBuffer Buffer do arquivo de áudio
   * @param mimeType Tipo MIME do arquivo
   * @returns Resultado da transcrição
   */
  async transcribeWithEvolutionAPI(audioBuffer: Buffer, mimeType: string = 'audio/ogg'): Promise<VoiceProcessingResult<string>> {
    if (!this.evolutionClient) {
      return {
        success: false,
        error: 'Evolution API client não configurado'
      }
    }

    try {
      const result = await this.evolutionClient.transcribeAudio(audioBuffer, mimeType)
      
      if (result.success && result.text) {
        return {
          success: true,
          data: result.text
        }
      } else {
        return {
          success: false,
          error: result.message || 'Falha na transcrição com Evolution API'
        }
      }
    } catch (error) {
      console.error('[Voice Processing Service] Erro ao transcrever com Evolution API:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido na transcrição com Evolution API'
      }
    }
  }

  /**
   * Baixa um arquivo de áudio a partir de uma URL
   * @param url URL do arquivo de áudio
   * @returns Buffer contendo o arquivo de áudio
   */
  private async downloadAudio(url: string): Promise<Buffer> {
    try {
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Falha ao baixar áudio: ${response.status} ${response.statusText}`)
      }
      
      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      console.error('[Voice Processing Service] Erro ao baixar áudio:', error)
      throw error
    }
  }
}