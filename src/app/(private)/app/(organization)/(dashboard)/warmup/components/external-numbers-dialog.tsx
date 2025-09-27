'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { EXTERNAL_NUMBERS } from '@/features/warmup/warmup.constants'
import { api } from '@/igniter.client'
import { Phone, Plus, Trash2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface ExternalNumber {
  id: string
  phoneNumber: string
  name?: string
  active: boolean
  createdAt: string
}

interface ExternalNumbersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ExternalNumbersDialog({
  open,
  onOpenChange,
}: ExternalNumbersDialogProps) {
  const [numbers, setNumbers] = useState<ExternalNumber[]>([])
  const [newNumber, setNewNumber] = useState('')
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLoadingNumbers, setIsLoadingNumbers] = useState(false)

  // Carregar números externos existentes
  useEffect(() => {
    const fetchNumbers = async () => {
      try {
        setIsLoadingNumbers(true)
        const result = await (api.warmup.manageExternalNumbers as any).mutate({
          body: { action: 'list' },
        })

        console.log('[External Numbers] Lista carregada:', result)

        // Assumindo que a resposta tem os números
        if (result && 'data' in result) {
          const data = result.data as any
          if (data.numbers) {
            setNumbers(data.numbers)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar números externos:', error)
        toast.error('Erro ao carregar números externos')
      } finally {
        setIsLoadingNumbers(false)
      }
    }

    if (open) {
      fetchNumbers()
    }
  }, [open])

  const addExternalNumber = async () => {
    if (!newNumber.trim()) {
      toast.error('Digite um número válido')
      return
    }

    // Validar formato do número (deve começar com código do país)
    const cleanNumber = newNumber.replace(/\D/g, '')
    if (cleanNumber.length < 10 || cleanNumber.length > 15) {
      toast.error('Número deve ter entre 10 e 15 dígitos')
      return
    }

    try {
      setLoading(true)
      const result = await (api.warmup.manageExternalNumbers as any).mutate({
        body: {
          action: 'add',
          phoneNumber: cleanNumber,
          name: newName.trim() || undefined,
        },
      })

      console.log('[External Numbers] Número adicionado:', result)

      toast.success('Número adicionado com sucesso')
      setNewNumber('')
      setNewName('')

      // Recarregar lista
      await fetchNumbers()
    } catch (error: any) {
      console.error('Erro ao adicionar número:', error)

      let errorMessage = 'Erro ao adicionar número'
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.error?.message) {
        errorMessage = error.error.message
      }

      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const removeExternalNumber = async (phoneNumber: string) => {
    try {
      setLoading(true)
      const result = await (api.warmup.manageExternalNumbers as any).mutate({
        body: {
          action: 'remove',
          phoneNumber,
        },
      })

      console.log('[External Numbers] Número removido:', result)

      toast.success('Número removido com sucesso')

      // Recarregar lista
      await fetchNumbers()
    } catch (error: any) {
      console.error('Erro ao remover número:', error)

      let errorMessage = 'Erro ao remover número'
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.error?.message) {
        errorMessage = error.error.message
      }

      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const toggleNumberStatus = async (phoneNumber: string, active: boolean) => {
    try {
      const result = await (api.warmup.manageExternalNumbers as any).mutate({
        body: {
          action: 'toggle',
          phoneNumber,
          active,
        },
      })

      console.log('[External Numbers] Status alterado:', result)

      // Atualizar localmente
      setNumbers(prev =>
        prev.map(num =>
          num.phoneNumber === phoneNumber
            ? { ...num, active }
            : num
        )
      )

      toast.success(`Número ${active ? 'ativado' : 'desativado'}`)
    } catch (error: any) {
      console.error('Erro ao alterar status:', error)

      let errorMessage = 'Erro ao alterar status'
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.error?.message) {
        errorMessage = error.error.message
      }

      toast.error(errorMessage)
    }
  }

  const addDefaultNumbers = async () => {
    try {
      setLoading(true)

      const addPromises = EXTERNAL_NUMBERS.map(async (number) => {
        try {
          await (api.warmup.manageExternalNumbers as any).mutate({
            body: {
              action: 'add',
              phoneNumber: number,
              name: `Número ${number.slice(-4)}`,
            },
          })
        } catch (error) {
          // Ignorar erros de números duplicados
          console.log(`Número ${number} já existe ou erro:`, error)
        }
      })

      await Promise.all(addPromises)

      toast.success('Números padrão adicionados!')

      // Recarregar lista
      await fetchNumbers()
    } catch (error: any) {
      console.error('Erro ao adicionar números padrão:', error)
      toast.error('Erro ao adicionar números padrão')
    } finally {
      setLoading(false)
    }
  }

  const fetchNumbers = async () => {
    try {
      const result = await (api.warmup.manageExternalNumbers as any).mutate({
        body: { action: 'list' },
      })

      if (result && 'data' in result) {
        const data = result.data as any
        if (data.numbers) {
          setNumbers(data.numbers)
        }
      }
    } catch (error) {
      console.error('Erro ao recarregar números:', error)
    }
  }

  const formatPhoneNumber = (phone: string) => {
    // Formatar número para exibição (XX) XXXXX-XXXX
    if (phone.length >= 11) {
      return `(${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`
    }
    return phone
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Números Externos
          </DialogTitle>
          <DialogDescription>
            Gerencie os números externos que serão usados durante o aquecimento para simular conversas naturais.
            Estes números são usados automaticamente pelo sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Adicionar novo número */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Adicionar Número</CardTitle>
              <CardDescription>
                Adicione um novo número externo para ser usado no aquecimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Número do Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Ex: 5511999999999"
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Digite apenas números, incluindo código do país
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome/Descrição (opcional)</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Contato teste"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={addExternalNumber}
                  disabled={loading || !newNumber.trim()}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>

                <Button
                  variant="outline"
                  onClick={addDefaultNumbers}
                  disabled={loading}
                  className="gap-2"
                >
                  <Users className="h-4 w-4" />
                  Adicionar Números Padrão ({EXTERNAL_NUMBERS.length})
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de números */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Números Cadastrados ({numbers.length})
              </CardTitle>
              <CardDescription>
                Lista de números externos disponíveis para o aquecimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingNumbers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2">Carregando números...</span>
                </div>
              ) : numbers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Phone className="mx-auto h-12 w-12 mb-4" />
                  <p>Nenhum número externo cadastrado</p>
                  <p className="text-sm">Adicione números para melhorar o aquecimento</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {numbers.map((number) => (
                    <div
                      key={number.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">
                            {formatPhoneNumber(number.phoneNumber)}
                          </p>
                          {number.name && (
                            <p className="text-sm text-muted-foreground">
                              {number.name}
                            </p>
                          )}
                        </div>

                        <Badge
                          variant={number.active ? 'default' : 'secondary'}
                        >
                          {number.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={number.active}
                          onCheckedChange={(checked) =>
                            toggleNumberStatus(number.phoneNumber, checked)
                          }
                        />

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExternalNumber(number.phoneNumber)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
