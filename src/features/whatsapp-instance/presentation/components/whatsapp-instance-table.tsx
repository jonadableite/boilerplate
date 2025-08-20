import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table/data-table'
import { DataTablePagination } from '@/components/ui/data-table/data-table-pagination'
import { DataTableProvider } from '@/components/ui/data-table/data-table-provider'
import { UserAvatar } from '@/components/ui/user-avatar'
import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { MessageCircle, Shield } from 'lucide-react'
import {
  type WhatsAppInstance,
  InstanceConnectionStatus,
} from '../../whatsapp-instance.types'
import { WhatsAppInstanceActions } from './whatsapp-instance-actions'

// Define colunas da tabela
const columns: ColumnDef<WhatsAppInstance>[] = [
  {
    accessorKey: 'profile',
    header: 'Perfil WhatsApp',
    cell: ({ row }) => {
      const instance = row.original
      const profileName = instance.profileName || 'Sem nome'
      const ownerJid = instance.ownerJid || 'Não conectado'
      const profilePicUrl = instance.profilePicUrl
      const hasProxy = !!(instance.metadata as any)?.proxy?.enabled

      return (
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10 ring-2 ring-primary/10">
              <AvatarImage src={profilePicUrl || undefined} alt={profileName} />
              <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white">
                <MessageCircle className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            {hasProxy && (
              <div className="absolute -bottom-1 -right-1 rounded-full bg-blue-500 p-1">
                <Shield className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{profileName}</span>
              {hasProxy && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                  Proxy
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {ownerJid !== 'Não conectado' ? `+${ownerJid}` : ownerJid}
            </span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'instanceName',
    header: 'Nome da Instância',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.instanceName}</span>
        <span className="text-xs text-muted-foreground">
          ID: {row.original.id.slice(0, 8)}...
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      const statusConfig = {
        [InstanceConnectionStatus.OPEN]: {
          label: 'Conectado',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200',
        },
        [InstanceConnectionStatus.CLOSE]: {
          label: 'Desconectado',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200',
        },
        [InstanceConnectionStatus.CONNECTING]: {
          label: 'Conectando',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        },
      }

      const config = statusConfig[status]

      return (
        <Badge variant={config.variant} className={config.className}>
          {config.label}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'lastSeen',
    header: 'Última Atividade',
    cell: ({ row }) => {
      const lastSeen = row.original.lastSeen
      const updatedAt = row.original.updatedAt

      const date = lastSeen || updatedAt
      if (!date) return <span className="text-muted-foreground">-</span>

      return (
        <div className="flex flex-col">
          <span className="text-sm">
            {format(new Date(date), 'dd/MM/yyyy')}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(date), 'HH:mm')}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'createdBy',
    header: 'Criado por',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <UserAvatar user={row.original.createdBy!} className="h-7 w-7" />
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {row.original.createdBy?.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(row.original.createdAt), 'dd/MM/yyyy')}
          </span>
        </div>
      </div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <WhatsAppInstanceActions instance={row.original} />,
  },
]

interface WhatsAppInstanceTableProps {
  data: WhatsAppInstance[]
}

export function WhatsAppInstanceTable({ data }: WhatsAppInstanceTableProps) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
      <DataTableProvider columns={columns} data={data}>
        <div className="space-y-4">
          <DataTable className="rounded-lg" />
          <div className="px-4 pb-4">
            <DataTablePagination />
          </div>
        </div>
      </DataTableProvider>
    </div>
  )
}
