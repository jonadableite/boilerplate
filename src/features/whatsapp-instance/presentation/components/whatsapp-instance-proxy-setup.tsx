import { useDisclosure } from '@/@saas-boilerplate/hooks/use-disclosure'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { api } from '@/igniter.client'
import { zodResolver } from '@hookform/resolvers/zod'
import { Settings, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  setProxySchema,
  type SetProxyDTO,
  type WhatsAppInstance,
} from '../../whatsapp-instance.types'

interface WhatsAppInstanceProxySetupProps {
  instance: WhatsAppInstance
  trigger?: React.ReactNode
}

interface ProxyConfigResponse {
  success: boolean
  hasProxy: boolean
  config?: {
    enabled: boolean
    host: string
    port: string
    protocol: string
    username?: string
    password?: string
  } | null
  localMetadata?: any
  error?: string
}

export function WhatsAppInstanceProxySetup({
  instance,
  trigger,
}: WhatsAppInstanceProxySetupProps) {
  const router = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [isLoading, setIsLoading] = useState(false)
  const [currentConfig, setCurrentConfig] =
    useState<ProxyConfigResponse | null>(null)

  const form = useForm<SetProxyDTO>({
    resolver: zodResolver(setProxySchema),
    defaultValues: {
      enabled: false,
      host: '',
      port: '',
      protocol: 'http',
      username: '',
      password: '',
    },
  })

  // Buscar configuração atual quando abrir o modal
  useEffect(() => {
    if (isOpen) {
      loadCurrentConfig()
    }
  }, [isOpen])

  const loadCurrentConfig = async () => {
    try {
      const response = await (api.whatsAppInstances.getProxy as any).query({
        params: { id: instance.id },
      })

      if (response.data && response.data.config) {
        const config = response.data.config
        form.reset({
          enabled: config.enabled || false,
          host: config.host || '',
          port: config.port || '',
          protocol: config.protocol || 'http',
          username: config.username || '',
          password: config.password || '',
        })
        setCurrentConfig(response.data)
      } else {
        // Resetar para valores padrão se não houver configuração
        form.reset({
          enabled: false,
          host: '',
          port: '',
          protocol: 'http',
          username: '',
          password: '',
        })
        setCurrentConfig(null)
      }
    } catch (error) {
      console.error('Erro ao carregar configuração de proxy:', error)
      toast.error('Erro ao carregar configuração de proxy')
    }
  }

  const onSubmit = async (data: SetProxyDTO) => {
    try {
      setIsLoading(true)
      await (api.whatsAppInstances.setProxy as any).mutate({
        params: { id: instance.id },
        body: data,
      })

      toast.success('Proxy configurado com sucesso!')
      router.refresh()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao configurar proxy')
    } finally {
      setIsLoading(false)
    }
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm" onClick={onOpen}>
      <Shield className="mr-2 h-4 w-4" />
      Configurar Proxy
    </Button>
  )

  return (
    <>
      {trigger ? <div onClick={onOpen}>{trigger}</div> : defaultTrigger}

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-h-[85vh] max-w-[480px] flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-3">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" />
              Configurar Proxy
            </DialogTitle>
            <DialogDescription className="text-sm">
              Configure as configurações de proxy para a instância{' '}
              <strong>{instance.instanceName}</strong>
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Conteúdo principal com scroll */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {/* Status atual - mais compacto */}
                {currentConfig && (
                  <div className="rounded-lg border bg-muted/50 p-2.5">
                    <div className="flex items-center gap-2 text-xs">
                      <Settings className="h-3.5 w-3.5" />
                      <span className="font-medium">Status:</span>
                      <span
                        className={
                          currentConfig.hasProxy
                            ? 'text-green-600'
                            : 'text-muted-foreground'
                        }
                      >
                        {currentConfig.hasProxy
                          ? 'Proxy configurado'
                          : 'Sem proxy'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Habilitar Proxy - mais compacto */}
                <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-medium">
                          Habilitar Proxy
                        </FormLabel>
                        <div className="text-xs text-muted-foreground">
                          Ativar conexão via proxy
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Campos do proxy - só mostrar se estiver habilitado */}
                {form.watch('enabled') && (
                  <div className="space-y-3">
                    {/* Host e Porta na mesma linha */}
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="host"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Host</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="proxy.exemplo.com"
                                className="h-8 text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="port"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">Porta</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="8080"
                                className="h-8 text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Protocolo */}
                    <FormField
                      control={form.control}
                      name="protocol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">Protocolo</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Selecione o protocolo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="http">HTTP</SelectItem>
                              <SelectItem value="https">HTTPS</SelectItem>
                              <SelectItem value="socks4">SOCKS4</SelectItem>
                              <SelectItem value="socks5">SOCKS5</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Username e Password na mesma linha */}
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">
                              Usuário{' '}
                              <span className="text-muted-foreground text-xs">
                                (opc.)
                              </span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="usuario"
                                className="h-8 text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm">
                              Senha{' '}
                              <span className="text-muted-foreground text-xs">
                                (opc.)
                              </span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="senha"
                                className="h-8 text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer fixo sempre visível */}
              <DialogFooter className="flex-shrink-0 pt-3 border-t bg-background mt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  size="sm"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} size="sm">
                  {isLoading ? 'Configurando...' : 'Configurar Proxy'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
