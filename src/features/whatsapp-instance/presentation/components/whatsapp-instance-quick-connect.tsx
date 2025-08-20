// src/features/whatsapp-instance/presentation/components/whatsapp-instance-quick-connect.tsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Clock, Smartphone } from 'lucide-react'
import { useState } from 'react'
import {
  type WhatsAppInstance,
  InstanceConnectionStatus,
} from '../../whatsapp-instance.types'
import { WhatsAppInstanceQrModal } from './whatsapp-instance-qr-modal'

interface WhatsAppInstanceQuickConnectProps {
  instances: WhatsAppInstance[]
  onInstanceConnected?: (instance: WhatsAppInstance) => void
}

export function WhatsAppInstanceQuickConnect({
  instances,
  onInstanceConnected,
}: WhatsAppInstanceQuickConnectProps) {
  const [selectedInstance, setSelectedInstance] =
    useState<WhatsAppInstance | null>(null)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)

  // Filtrar apenas instâncias que estão conectando ou têm QR Code disponível
  const pendingInstances = instances.filter(
    (instance) =>
      instance.status === InstanceConnectionStatus.CONNECTING ||
      (instance.metadata as any)?.qrcode?.base64,
  )

  const handleConnectInstance = (instance: WhatsAppInstance) => {
    setSelectedInstance(instance)
    setIsQrModalOpen(true)
  }

  const handleQrModalSuccess = (instance: WhatsAppInstance) => {
    setSelectedInstance(null)
    setIsQrModalOpen(false)
    onInstanceConnected?.(instance)
  }

  const handleQrModalClose = () => {
    setSelectedInstance(null)
    setIsQrModalOpen(false)
  }

  const getStatusInfo = (instance: WhatsAppInstance) => {
    switch (instance.status) {
      case InstanceConnectionStatus.OPEN:
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-600" />,
          badge: (
            <Badge
              variant="default"
              className="bg-green-100 text-green-800 border-green-200"
            >
              Conectado
            </Badge>
          ),
          description: 'WhatsApp conectado e funcionando',
        }
      case InstanceConnectionStatus.CONNECTING:
        return {
          icon: <Clock className="w-4 h-4 text-yellow-600" />,
          badge: (
            <Badge
              variant="secondary"
              className="bg-yellow-100 text-yellow-800 border-yellow-200"
            >
              Aguardando
            </Badge>
          ),
          description: 'Aguardando conexão do WhatsApp',
        }
      default:
        return {
          icon: <Smartphone className="w-4 h-4 text-gray-600" />,
          badge: <Badge variant="outline">Desconectado</Badge>,
          description: 'Instância criada, pronta para conectar',
        }
    }
  }

  if (pendingInstances.length === 0) {
    return null
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Instâncias Aguardando Conexão
            <Badge variant="secondary">{pendingInstances.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingInstances.map((instance) => {
              const statusInfo = getStatusInfo(instance)
              const hasQrCode = (instance.metadata as any)?.qrcode?.base64

              return (
                <Card
                  key={instance.id}
                  className="border-2 border-dashed border-muted hover:border-primary/50 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {statusInfo.icon}
                        <h3 className="font-medium text-sm truncate">
                          {instance.instanceName}
                        </h3>
                      </div>
                      {statusInfo.badge}
                    </div>

                    <p className="text-xs text-muted-foreground mb-3">
                      {statusInfo.description}
                    </p>

                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant={hasQrCode ? 'default' : 'outline'}
                        onClick={() => handleConnectInstance(instance)}
                        disabled={!hasQrCode}
                        className="w-full"
                      >
                        <Smartphone className="w-3 h-3 mr-1" />
                        {hasQrCode ? 'Conectar Agora' : 'Gerando QR...'}
                      </Button>

                      {instance.status ===
                        InstanceConnectionStatus.CONNECTING && (
                          <div className="text-xs text-center text-muted-foreground">
                            Criado há{' '}
                            {Math.floor(
                              (Date.now() -
                                new Date(instance.createdAt).getTime()) /
                              1000 /
                              60,
                            )}{' '}
                            min
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Dica:</strong> Para criar múltiplas instâncias
              rapidamente, conecte uma de cada vez. Depois de escanear o QR
              Code, você pode criar a próxima instância.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      <WhatsAppInstanceQrModal
        instance={selectedInstance}
        isOpen={isQrModalOpen}
        onClose={handleQrModalClose}
        onSuccess={handleQrModalSuccess}
        autoRefresh={true}
      />
    </>
  )
}
