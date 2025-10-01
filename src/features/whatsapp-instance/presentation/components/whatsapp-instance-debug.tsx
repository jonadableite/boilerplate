import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/igniter.client'
import { useQueryClient } from '@tanstack/react-query'
import { Code, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function WhatsAppInstanceDebug() {
  const queryClient = useQueryClient()
  const [isDebugging, setIsDebugging] = useState(false)
  const [debugLogs, setDebugLogs] = useState<string[]>([])

  const handleDebugSync = async () => {
    try {
      setIsDebugging(true)
      setDebugLogs(['🔄 Iniciando sincronização...'])

      const result = await (api.whatsAppInstances.syncAll as any).mutate()

      // Invalidar cache das queries relacionadas
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['whatsAppInstances', 'list'] }),
        queryClient.invalidateQueries({ queryKey: ['whatsAppInstances', 'stats'] }),
      ])

      setDebugLogs(prev => [
        ...prev,
        '✅ Sincronização concluída!',
        '🔄 Cache invalidado!',
        `📊 Resposta: ${JSON.stringify(result, null, 2)}`,
      ])

      toast.success('Debug concluído! Verifique os logs.')
    } catch (error) {
      setDebugLogs(prev => [
        ...prev,
        `❌ Erro: ${error}`,
      ])
      toast.error('Erro no debug')
    } finally {
      setIsDebugging(false)
    }
  }

  const clearLogs = () => {
    setDebugLogs([])
  }

  return (
    <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700">
          <Code className="h-5 w-5" />
          Debug - Sincronização Evolution API
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={handleDebugSync}
            disabled={isDebugging}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isDebugging ? 'animate-spin' : ''}`} />
            {isDebugging ? 'Sincronizando...' : 'Testar Sincronização'}
          </Button>

          <Button
            onClick={clearLogs}
            variant="ghost"
            size="sm"
          >
            Limpar Logs
          </Button>
        </div>

        {debugLogs.length > 0 && (
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs max-h-64 overflow-y-auto">
            {debugLogs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}