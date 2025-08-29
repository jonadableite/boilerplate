'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, Square, Loader2 } from 'lucide-react'
import { useSpeechToText } from '@saas-boilerplate/hooks/use-speech-to-text'

interface VoiceRecorderProps {
  onTranscription?: (text: string) => void
  onAudioCapture?: (audioBlob: Blob) => void
  language?: string
  maxDuration?: number // em segundos
  className?: string
}

/**
 * Componente para gravação de voz e transcrição em tempo real
 */
export const VoiceRecorder = ({
  onTranscription,
  onAudioCapture,
  language = 'pt-BR',
  maxDuration = 60,
  className = '',
}: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Hook de reconhecimento de fala para transcrição em tempo real
  const { transcript, start: startSpeechRecognition, stop: stopSpeechRecognition, isListening } = useSpeechToText({
    lang: language,
    continuous: true,
    interimResults: true,
    onResult: (result) => {
      onTranscription?.(result)
    },
    onError: (error) => {
      console.error('Erro na transcrição:', error)
    },
  })

  // Iniciar gravação
  const startRecording = async () => {
    try {
      audioChunksRef.current = []
      setAudioBlob(null)
      setRecordingTime(0)
      setIsRecording(true)

      // Solicitar permissão para acessar o microfone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Configurar o MediaRecorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      // Configurar evento para capturar dados
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      // Configurar evento para quando a gravação terminar
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
        onAudioCapture?.(audioBlob)
        
        // Parar todos os tracks do stream
        stream.getTracks().forEach(track => track.stop())
      }
      
      // Iniciar gravação
      mediaRecorder.start()
      
      // Iniciar reconhecimento de fala para transcrição em tempo real
      startSpeechRecognition()
      
      // Iniciar timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1
          // Parar automaticamente se atingir o tempo máximo
          if (newTime >= maxDuration) {
            stopRecording()
          }
          return newTime
        })
      }, 1000)
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error)
      setIsRecording(false)
    }
  }

  // Parar gravação
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    
    // Parar reconhecimento de fala
    stopSpeechRecognition()
    
    // Limpar timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    
    setIsRecording(false)
  }

  // Limpar recursos quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Formatar tempo de gravação
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {isRecording ? (
        <>
          <Button
            variant="destructive"
            size="icon"
            onClick={stopRecording}
            disabled={isProcessing}
          >
            <Square className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
          <div className="animate-pulse">
            <div className="h-2 w-2 rounded-full bg-red-500"></div>
          </div>
        </>
      ) : (
        <Button
          variant="outline"
          size="icon"
          onClick={startRecording}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  )
}

export default VoiceRecorder