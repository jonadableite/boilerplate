import { useDisclosure } from '@/@saas-boilerplate/hooks/use-disclosure'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '@/igniter.client'
import {
  MoreHorizontal,
  RefreshCcw,
  RotateCcw,
  Shield,
  Trash2,
  Wifi,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  type WhatsAppInstance,
  InstanceConnectionStatus,
} from '../../whatsapp-instance.types'
import { WhatsAppInstanceProxySetup } from './whatsapp-instance-proxy-setup'
import { WhatsAppInstanceQrModal } from './whatsapp-instance-qr-modal'

interface WhatsAppInstanceActionsProps {
  instance: WhatsAppInstance
}

export function WhatsAppInstanceActions({
  instance,
}: WhatsAppInstanceActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()

  // QR Modal state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [qrInstance, setQrInstance] = useState<WhatsAppInstance | null>(null)

  // Conectar instância e obter QR Code
  const handleConnect = async () => {
    try {
      setIsLoading(true)
      console.log(
        '[WhatsApp Instance] Iniciando conexão da instância:',
        instance.id,
      )

      const result = await api.whatsAppInstances.connect.mutate({
        params: { id: instance.id },
      })

      console.log('[WhatsApp Instance] Resultado da conexão:', result)
      console.log('[WhatsApp Instance] hasQrCode:', result.data?.hasQrCode)
      console.log('[WhatsApp Instance] qrCode:', result.data?.qrCode)

      if (result.data?.hasQrCode && result.data?.qrCode) {
        // Se há QR Code, abrir modal
        console.log(
          '[WhatsApp Instance] Abrindo modal QR com instância:',
          result.data.data,
        )
        setQrInstance(result.data.data as WhatsAppInstance)
        setIsQrModalOpen(true)
        toast.success('QR Code gerado! Escaneie para conectar.')
      } else {
        console.log(
          '[WhatsApp Instance] Sem QR Code, apenas atualizando status',
        )
        toast.success('Instância conectada com sucesso!')
        router.refresh()
      }
    } catch (error: any) {
      console.error('[WhatsApp Instance] Erro na conexão:', error)
      let errorMessage = 'Erro ao conectar instância'
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.error?.message) {
        errorMessage = error.error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Sincronizar status
  const handleSync = async () => {
    try {
      setIsLoading(true)
      await api.whatsAppInstances.syncStatus.mutate({
        params: { id: instance.id },
      })
      toast.success('Status sincronizado com sucesso!')
      router.refresh()
    } catch (error) {
      toast.error('Erro ao sincronizar status')
    } finally {
      setIsLoading(false)
    }
  }

  // Reconectar instância
  const handleReconnect = async () => {
    try {
      setIsLoading(true)
      await api.whatsAppInstances.update.mutate({
        params: { id: instance.id },
        body: { status: InstanceConnectionStatus.CONNECTING },
      })
      toast.success('Reconectando instância...')
      router.refresh()
    } catch (error) {
      toast.error('Erro ao reconectar instância')
    } finally {
      setIsLoading(false)
    }
  }

  // Deletar instância
  const handleDelete = async () => {
    try {
      setIsLoading(true)
      await api.whatsAppInstances.delete.mutate({
        params: { id: instance.id },
      })
      toast.success('Instância deletada com sucesso')
      router.refresh()
      onClose()
    } catch (error) {
      toast.error('Erro ao deletar instância')
    } finally {
      setIsLoading(false)
    }
  }

  // Verificar se a instância pode ser conectada
  const canConnect =
    instance.status === InstanceConnectionStatus.CLOSE ||
    instance.status === InstanceConnectionStatus.CONNECTING

  const handleQrModalSuccess = (instance: WhatsAppInstance) => {
    setQrInstance(null)
    setIsQrModalOpen(false)
    router.refresh()
    toast.success(`Instância "${instance.instanceName}" conectada com sucesso!`)
  }

  const handleQrModalClose = () => {
    setQrInstance(null)
    setIsQrModalOpen(false)
    router.refresh()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* Botão Conectar - só aparece se a instância não estiver conectada */}
          {canConnect && (
            <>
              <DropdownMenuItem onClick={handleConnect} disabled={isLoading}>
                <Wifi className="mr-2 h-4 w-4" />
                Conectar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem onClick={handleSync} disabled={isLoading}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Sincronizar Status
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <WhatsAppInstanceProxySetup
            instance={instance}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Shield className="mr-2 h-4 w-4" />
                Configurar Proxy
              </DropdownMenuItem>
            }
          />
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleReconnect}
            disabled={
              isLoading || instance.status === InstanceConnectionStatus.OPEN
            }
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reconectar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onOpen}
            disabled={isLoading}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Deletar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal de confirmação para deletar */}
      <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Instância</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar esta instância? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              {isLoading ? 'Deletando...' : 'Deletar'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal QR Code para conexão */}
      <WhatsAppInstanceQrModal
        instance={qrInstance}
        isOpen={isQrModalOpen}
        onClose={handleQrModalClose}
        onSuccess={handleQrModalSuccess}
        autoRefresh={true}
      />
    </>
  )
}
