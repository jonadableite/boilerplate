import { OpenAI } from 'openai'

export class TTSService {
  private openai: OpenAI

  constructor(apiKey?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    })
  }

  /**
   * Converte texto em áudio usando OpenAI TTS
   */
  async textToSpeech({
    text,
    voice = 'alloy',
    model = 'tts-1',
    speed = 1.0,
  }: {
    text: string
    voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
    model?: 'tts-1' | 'tts-1-hd'
    speed?: number
  }): Promise<Buffer> {
    try {
      console.log('Generating speech from text', {
        textLength: text.length,
        voice,
        model,
        speed,
      })

      const mp3 = await this.openai.audio.speech.create({
        model,
        voice,
        input: text,
        speed,
      })

      const buffer = Buffer.from(await mp3.arrayBuffer())
      
      console.log('Speech generated successfully', {
        audioSize: buffer.length,
      })

      return buffer
    } catch (error) {
      console.error('Error generating speech', { error })
      throw new Error('Failed to generate speech')
    }
  }

  /**
   * Verifica se o texto é adequado para TTS
   */
  isTextSuitableForTTS(text: string): boolean {
    // Remover markdown e formatação
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1') // Italic
      .replace(/`(.*?)`/g, '$1') // Code
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
      .replace(/#{1,6}\s/g, '') // Headers
      .replace(/\n+/g, ' ') // Line breaks
      .trim()

    // Verificar se o texto é adequado
    const wordCount = cleanText.split(/\s+/).length
    const hasCode = text.includes('```') || text.includes('function') || text.includes('const ')
    const hasTables = text.includes('|') && text.includes('---')
    
    return (
      cleanText.length > 10 && // Mínimo de caracteres
      cleanText.length < 4000 && // Máximo de caracteres
      wordCount > 3 && // Mínimo de palavras
      wordCount < 500 && // Máximo de palavras
      !hasCode && // Não contém código
      !hasTables // Não contém tabelas
    )
  }

  /**
   * Limpa o texto para TTS removendo formatação
   */
  cleanTextForTTS(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1') // Italic
      .replace(/`(.*?)`/g, '$1') // Inline code
      .replace(/```[\s\S]*?```/g, '[código]') // Code blocks
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
      .replace(/#{1,6}\s/g, '') // Headers
      .replace(/\|.*\|/g, '') // Table rows
      .replace(/\n+/g, '. ') // Line breaks to periods
      .replace(/\s+/g, ' ') // Multiple spaces
      .replace(/\.\.+/g, '.') // Multiple periods
      .trim()
  }
}