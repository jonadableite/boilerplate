import useDebounce from '@/@saas-boilerplate/hooks/use-debounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/igniter.client'
import { Filter, RefreshCw, Search } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { InstanceConnectionStatus } from '../../whatsapp-instance.types'

// Mapa de status para exibição
const statusOptions = [
  { value: 'all', label: 'Todos os Status', icon: '🔄' },
  { value: InstanceConnectionStatus.OPEN, label: 'Conectado', icon: '🟢' },
  { value: InstanceConnectionStatus.CLOSE, label: 'Desconectado', icon: '🔴' },
  {
    value: InstanceConnectionStatus.CONNECTING,
    label: 'Conectando',
    icon: '🟡',
  },
]

export function WhatsAppInstanceToolbar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Estado local para inputs
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState(searchParams.get('status') || 'all')

  // Debounce na busca para evitar muitas requisições
  const { debouncedValue: debouncedSearch } = useDebounce(search, 500)

  // Sincronizar todas as instâncias
  const handleRefreshAll = async () => {
    try {
      setIsRefreshing(true)
      const result = await api.whatsAppInstances.syncAll.mutate()

      // Verifica se a resposta é de sucesso e tem dados
      if (result && 'data' in result && result.data) {
        toast.success(
          result.data.message || 'Instâncias sincronizadas com sucesso!',
        )
      } else {
        toast.success('Instâncias sincronizadas com sucesso!')
      }

      router.refresh()
    } catch (error) {
      toast.error('Erro ao sincronizar instâncias')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Atualiza URL com filtros
  const createQueryString = useCallback(
    (params: Record<string, string>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()))

      // Remove valores vazios ou undefined
      Object.entries(params).forEach(([key, value]) => {
        if (!value || value.trim() === '') {
          current.delete(key)
        } else {
          current.set(key, value.trim())
        }
      })

      return current.toString()
    },
    [searchParams],
  )

  // Atualiza URL quando mudam os filtros
  useEffect(() => {
    const queryString = createQueryString({
      search: debouncedSearch,
      status,
    })

    router.push(`${pathname}?${queryString}`)
  }, [debouncedSearch, status, pathname, router, createQueryString])

  return (
    <div className="flex items-center gap-4 w-full">
      {/* Seção de Busca */}
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <Input
            type="text"
            placeholder="Buscar por nome ou número..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50 focus:bg-background transition-all duration-200 placeholder:text-muted-foreground/70"
          />
        </div>
      </div>

      {/* Filtro de Status */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px] bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent className="bg-background/95 backdrop-blur-sm border-border/50">
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Botão de Sincronização */}
      <Button
        variant="outline"
        size="default"
        onClick={handleRefreshAll}
        disabled={isRefreshing}
        className="bg-primary/5 hover:bg-primary/10 border-primary/20 hover:border-primary/30 text-primary hover:text-primary/90 backdrop-blur-sm transition-all duration-200"
      >
        <RefreshCw
          className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
        />
        {isRefreshing ? 'Sincronizando...' : 'Atualizar Tudo'}
      </Button>
    </div>
  )
}
