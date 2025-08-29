'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { AudioPlayer } from './audio-player'
import { VoiceRecorder } from './voice-recorder'

interface AudioMessageProps {
  onAudioCapture?: (audioBlob: Blob) => Promise<void>
  onTranscription?: (text: string) => void
  isProcessing?: boolean
  responseAudioUrl?: string
  language?: string
  className?: string
}

/**
 * Componente para mensagens de áudio no chat
 * Permite gravar áudio, exibir transcrição e reproduzir respostas
 */
export const AudioMessage = ({
  onAudioCapture,
  onTranscription,
  isProcessing = false,
  responseAudioUrl,
  language = 'pt-BR',
  className = '',
}: AudioMessageProps) => {
  const [capturedAudio, setCapturedAudio] = useState<Blob | null>(null)
  const [transcription, setTranscription] = useState('')

  // Manipular captura de áudio
  const handleAudioCapture = async (audioBlob: Blob) => {
    setCapturedAudio(audioBlob)
    
    if (onAudioCapture) {
      await onAudioCapture(audioBlob)
    }
  }

  // Manipular transcrição em tempo real
  const handleTranscription = (text: string) => {
    setTranscription(text)
    
    if (onTranscription) {
      onTranscription(text)
    }
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex flex-col gap-4">
        {/* Gravador de voz */}
        <div className="flex items-center justify-between">
          <VoiceRecorder
            onAudioCapture={handleAudioCapture}
            onTranscription={handleTranscription}
            language={language}
          />
          
          {isProcessing && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Processando...</span>
            </div>
          )}
        </div>

        {/* Exibir transcrição */}
        {transcription && (
          <div className="mt-2">
            <p className="text-sm font-medium">Transcrição:</p>
            <p className="text-sm text-muted-foreground">{transcription}</p>
          </div>
        )}

        {/* Reprodutor de áudio para resposta */}
        {responseAudioUrl && (
          <div className="mt-2">
            <p className="text-sm font-medium mb-2">Resposta:</p>
            <AudioPlayer audioUrl={responseAudioUrl} autoPlay={true} />
          </div>
        )}
      </div>
    </Card>
  )
}

export default AudioMessage