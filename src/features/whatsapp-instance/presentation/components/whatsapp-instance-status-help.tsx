import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { api } from '@/igniter.client'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface WhatsAppInstanceStatusHelpProps {
  instanceId: string
  onStatusUpdated?: () => void
}

export function WhatsAppInstanceStatusHelp({
  instanceId,
  onStatusUpdated,
}: WhatsAppInstanceStatusHelpProps) {
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSyncStatus = async () => {
    try {
      setIsSyncing(true)
      await (api.whatsAppInstances.syncStatus as any).mutate({
        params: { id: instanceId },
      })
      toast.success('Status sincronizado com sucesso!')
      onStatusUpdated?.()
    } catch (error) {
      toast.error('Erro ao sincronizar status')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <CardTitle className="text-base">Status não sincronizado</CardTitle>
        </div>
        <CardDescription className="text-sm">
          A instância foi conectada no WhatsApp, mas o status ainda não foi
          atualizado automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">
            <strong>Soluções:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>
              Clique no botão "Sincronizar" para atualizar o status manualmente
            </li>
            <li>
              Configure o webhook da Evolution API apontando para:{' '}
              <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">
                {process.env.NEXT_PUBLIC_APP_URL || 'https://seu-dominio.com'}
                /api/webhooks/evolution
              </code>
            </li>
            <li>O status será atualizado automaticamente em alguns segundos</li>
          </ul>
        </div>

        <Button
          onClick={handleSyncStatus}
          disabled={isSyncing}
          className="w-full"
          variant="outline"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sincronizar Status
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
