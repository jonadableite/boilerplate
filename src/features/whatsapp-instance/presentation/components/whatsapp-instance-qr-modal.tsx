// src/features/whatsapp-instance/presentation/components/whatsapp-instance-qr-modal.tsx
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { api } from '@/igniter.client'
import { CheckCircle, Clock, RefreshCw, X } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  type WhatsAppInstance,
  InstanceConnectionStatus,
} from '../../whatsapp-instance.types'

interface WhatsAppInstanceQrModalProps {
  instance: WhatsAppInstance | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: (instance: WhatsAppInstance) => void
  autoRefresh?: boolean
}

export function WhatsAppInstanceQrModal({
  instance,
  isOpen,
  onClose,
  onSuccess,
  autoRefresh = true,
}: WhatsAppInstanceQrModalProps) {
  const [currentInstance, setCurrentInstance] =
    useState<WhatsAppInstance | null>(instance)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Debug logs
  console.log('[QR Modal] Props recebidos:', {
    instance,
    isOpen,
    hasInstance: !!instance,
    instanceId: instance?.id,
    instanceName: instance?.instanceName,
  })

  // Get QR Code from metadata
  const qrCodeData = currentInstance?.metadata?.qrcode
  const hasQrCode = qrCodeData?.base64
  const isConnected = currentInstance?.status === InstanceConnectionStatus.OPEN
  const isConnecting =
    currentInstance?.status === InstanceConnectionStatus.CONNECTING

  console.log('[QR Modal] Estado do QR Code:', {
    hasQrCode,
    qrCodeData,
    isConnected,
    isConnecting,
    metadata: currentInstance?.metadata,
  })

  // Auto-refresh instance status
  const refreshInstanceStatus = useCallback(async () => {
    if (!currentInstance?.id || isRefreshing) return

    try {
      setIsRefreshing(true)
      const result = await (api.whatsAppInstances.list as any).query({
        search: currentInstance.instanceName,
        limit: 1,
      })

      if (result.data && result.data.data.length > 0) {
        const updatedInstance = result.data.data[0]
        setCurrentInstance(updatedInstance)

        // If connected, notify success and close modal
        if (updatedInstance.status === InstanceConnectionStatus.OPEN) {
          toast.success('Instância conectada com sucesso!')
          onSuccess?.(updatedInstance)
          onClose()
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar status da instância:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [
    currentInstance?.id,
    currentInstance?.instanceName,
    isRefreshing,
    onSuccess,
    onClose,
  ])

  // Auto-refresh countdown
  useEffect(() => {
    if (!autoRefresh || !isConnecting || countdown > 0) return

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          refreshInstanceStatus()
          return 5 // Reset to 5 seconds
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [autoRefresh, isConnecting, countdown, refreshInstanceStatus])

  // Initialize countdown when modal opens
  useEffect(() => {
    if (isOpen && isConnecting) {
      setCountdown(5)
    }
  }, [isOpen, isConnecting])

  // Update instance when prop changes
  useEffect(() => {
    setCurrentInstance(instance)
  }, [instance])

  // Monitor modal open/close state
  useEffect(() => {
    console.log('[QR Modal] Estado do modal mudou:', {
      isOpen,
      hasInstance: !!instance,
      instanceId: instance?.id,
    })
  }, [isOpen, instance])

  const handleManualRefresh = () => {
    setCountdown(0)
    refreshInstanceStatus()
  }

  const handleClose = () => {
    setCountdown(0)
    onClose()
  }

  const getStatusBadge = () => {
    if (isConnected) {
      return (
        <Badge
          variant="default"
          className="bg-green-100 text-green-800 border-green-200"
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          Conectado
        </Badge>
      )
    }

    if (isConnecting) {
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-100 text-yellow-800 border-yellow-200"
        >
          <Clock className="w-3 h-3 mr-1" />
          Conectando...
        </Badge>
      )
    }

    return (
      <Badge variant="destructive">
        <X className="w-3 h-3 mr-1" />
        Desconectado
      </Badge>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Conectar WhatsApp</span>
            {getStatusBadge()}
          </DialogTitle>
          <DialogDescription>
            {currentInstance && (
              <span className="font-medium text-foreground">
                {currentInstance.instanceName}
              </span>
            )}
            {isConnecting && (
              <span className="block text-sm text-muted-foreground mt-1">
                Escaneie o QR Code com seu WhatsApp para conectar
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isConnected ? (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Conectado com Sucesso!
                </h3>
                <p className="text-sm text-green-600 text-center">
                  Sua instância WhatsApp está pronta para uso
                </p>
              </CardContent>
            </Card>
          ) : hasQrCode ? (
            <div className="space-y-4">
              <Card>
                <CardContent className="flex justify-center p-4">
                  <div className="relative">
                    <Image
                      src={qrCodeData.base64}
                      alt="QR Code WhatsApp"
                      width={200}
                      height={200}
                      className="rounded-lg border"
                    />
                    {isRefreshing && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg">
                        <RefreshCw className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {isConnecting && autoRefresh && (
                <div className="text-center text-sm text-muted-foreground">
                  Verificando status... {countdown > 0 && `(${countdown}s)`}
                </div>
              )}

              <div className="text-xs text-muted-foreground space-y-1">
                <p>1. Abra o WhatsApp no seu celular</p>
                <p>2. Toque em "Mais opções" → "Aparelhos conectados"</p>
                <p>3. Toque em "Conectar um aparelho"</p>
                <p>
                  4. Aponte seu celular para esta tela para capturar o código
                </p>
              </div>
            </div>
          ) : (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Clock className="w-16 h-16 text-yellow-600 mb-4" />
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Gerando QR Code...
                </h3>
                <p className="text-sm text-yellow-600 text-center">
                  Aguarde alguns segundos enquanto preparamos sua conexão
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isConnecting && (
            <Button
              variant="outline"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="order-2 sm:order-1"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              Atualizar Status
            </Button>
          )}

          <Button
            variant={isConnected ? 'default' : 'secondary'}
            onClick={handleClose}
            className="order-1 sm:order-2"
          >
            {isConnected ? 'Concluir' : 'Fechar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
