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
import { RefreshCw, Search } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { InstanceConnectionStatus } from '../../whatsapp-instance.types'

// Mapa de status para exibição
const statusOptions = [
  { value: 'all', label: 'Todos', icon: '🔄' },
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
      const result = await (api.whatsAppInstances.syncAll as any).mutate()
      
      // Invalidar cache das queries relacionadas
      await Promise.all([
        (api.whatsAppInstances.list as any).invalidate(),
        (api.whatsAppInstances.stats as any).invalidate(),
      ])
      
      // Verifica se a resposta é de sucesso e tem dados
      if (result && 'data' in result && result.data) {
        toast.success(
          result.data.message || 'Instâncias sincronizadas com sucesso!',
        )
      } else {
        toast.success('Instâncias sincronizadas com sucesso!')
      }
      
      // Forçar refresh da página como fallback
      router.refresh()
    } catch (error) {
      console.error('Erro ao sincronizar instâncias:', error)
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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
      {/* Seção de Busca - Responsiva */}
      <div className="flex-1 min-w-0">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <Input
            type="text"
            placeholder="Buscar instâncias..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 h-10 bg-background/60 backdrop-blur-sm border-border/40 focus:border-primary/60 focus:bg-background/80 transition-all duration-200 placeholder:text-muted-foreground/60 text-sm"
          />
        </div>
      </div>
      {/* Filtro de Status - Compacto */}
      <div className="flex items-center gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10 w-[140px] bg-background/60 backdrop-blur-sm border-border/40 focus:border-primary/60 text-sm">
            <SelectValue placeholder="Status" />
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

        {/* Botão de Atualizar Todas as Instâncias - MODIFICADO */}
        <Button
          variant="outline"
          size="icon" // Use size="icon" para um botão quadrado com apenas o ícone
          onClick={handleRefreshAll}
          disabled={isRefreshing}
          className="group h-10 w-10 bg-background/60 backdrop-blur-sm border-border/40 hover:border-primary/60 transition-colors duration-200"
        >
          <RefreshCw
            className={`h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-200 ${isRefreshing ? 'animate-spin' : 'group-hover:animate-spin'
              }`}
          />
        </Button>
      </div>
    </div>
  )
}
