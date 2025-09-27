// src/features/whatsapp-instance/presentation/components/whatsapp-instance-create.tsx
import { useDisclosure } from '@/@saas-boilerplate/hooks/use-disclosure'
import { useFormWithZod } from '@/@saas-boilerplate/hooks/use-form-with-zod'
import { Button } from '@/components/ui/button'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { api } from '@/igniter.client'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  createWhatsAppInstanceSchema,
  type WhatsAppInstance,
} from '../../whatsapp-instance.types'
import { WhatsAppInstanceQrModal } from './whatsapp-instance-qr-modal'

export function WhatsAppInstanceCreate() {
  const router = useRouter()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [isLoading, setIsLoading] = useState(false)

  // QR Modal state
  const [createdInstance, setCreatedInstance] =
    useState<WhatsAppInstance | null>(null)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)

  const form = useFormWithZod({
    schema: createWhatsAppInstanceSchema,
    defaultValues: {
      instanceName: '',
    },
    onSubmit: async (values) => {
      try {
        setIsLoading(true)

        const result = await (api.whatsAppInstances.create as any).mutate({
          body: {
            instanceName: values.instanceName,
          },
        })

        console.log('[WhatsApp Instance] Instância criada com sucesso:', result)

        // Fechar o modal de criação
        onClose()

        // Resetar o form para próxima criação
        form.reset()

        // Se a instância foi criada com QR Code, abrir modal QR
        const instanceData = result.data as any
        if (instanceData?.metadata?.qrcode?.base64) {
          setCreatedInstance(instanceData)
          setIsQrModalOpen(true)
          toast.success('Instância criada! Conecte escaneando o QR Code.')
        } else {
          toast.success('Instância criada com sucesso!')
          router.refresh()
        }
      } catch (error: any) {
        console.error('[WhatsApp Instance] Erro ao criar:', error)

        let errorMessage = 'Erro ao criar instância'
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
    },
  })

  const handleQrModalSuccess = (instance: WhatsAppInstance) => {
    setCreatedInstance(null)
    setIsQrModalOpen(false)
    router.refresh()
    toast.success(`Instância "${instance.instanceName}" conectada com sucesso!`)
  }

  const handleQrModalClose = () => {
    setCreatedInstance(null)
    setIsQrModalOpen(false)
    router.refresh()
  }

  return (
    <>
      <Sheet
        open={isOpen}
        onOpenChange={(open) => (open ? onOpen() : onClose())}
      >
        <SheetTrigger asChild>
          <Button onClick={onOpen}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Instância
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Nova Instância WhatsApp</SheetTitle>
            <SheetDescription>
              Crie uma nova instância do WhatsApp.
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.onSubmit} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="instanceName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Instância</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Suporte, Vendas, etc."
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !form.formState.isValid}
                >
                  {isLoading ? 'Criando...' : 'Criar Instância'}
                </Button>
              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* QR Code Modal */}
      <WhatsAppInstanceQrModal
        instance={createdInstance}
        isOpen={isQrModalOpen}
        onClose={handleQrModalClose}
        onSuccess={handleQrModalSuccess}
        autoRefresh={true}
      />
    </>
  )
}
