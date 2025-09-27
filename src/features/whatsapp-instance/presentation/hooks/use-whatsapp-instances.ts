// src/features/whatsapp-instance/presentation/hooks/use-whatsapp-instances.ts
import { api } from "@/igniter.client";
import { InstanceConnectionStatus } from "../../whatsapp-instance.types";

export interface UseWhatsAppInstancesOptions {
  /**
   * Filtrar apenas instâncias conectadas
   * @default false
   */
  onlyConnected?: boolean;
  /**
   * Incluir instâncias em processo de conexão
   * @default false
   */
  includeConnecting?: boolean;
  /**
   * Limite de instâncias a serem retornadas
   * @default 100
   */
  limit?: number;
}

/**
 * Hook para buscar instâncias WhatsApp da organização
 * Usado principalmente para seleção em modais e formulários
 */
export function useWhatsAppInstances(
  options: UseWhatsAppInstancesOptions = {},
) {
  const {
    onlyConnected = false,
    includeConnecting = false,
    limit = 100,
  } = options;

  // Construir filtros de status
  const statusFilter = (() => {
    if (onlyConnected && !includeConnecting) {
      return InstanceConnectionStatus.OPEN;
    }
    if (onlyConnected && includeConnecting) {
      return undefined; // Será filtrado no frontend
    }
    return undefined; // Buscar todas
  })();

  const queryParams = {
    page: 1,
    limit,
    ...(statusFilter && { status: statusFilter }),
  };

  const query = (api.whatsAppInstances.list as any).useQuery(queryParams);

  // Filtrar instâncias no frontend se necessário
  const filteredInstances =
    query.data?.data?.filter((instance) => {
      if (onlyConnected && includeConnecting) {
        return (
          instance.status === InstanceConnectionStatus.OPEN ||
          instance.status === InstanceConnectionStatus.CONNECTING
        );
      }
      return true;
    }) || [];

  return {
    instances: filteredInstances,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    // Estatísticas úteis
    stats: {
      total: filteredInstances.length,
      connected: filteredInstances.filter(
        (i) => i.status === InstanceConnectionStatus.OPEN,
      ).length,
      connecting: filteredInstances.filter(
        (i) => i.status === InstanceConnectionStatus.CONNECTING,
      ).length,
      disconnected: filteredInstances.filter(
        (i) => i.status === InstanceConnectionStatus.CLOSE,
      ).length,
    },
  };
}

/**
 * Hook simplificado para buscar apenas instâncias conectadas
 * Útil para seleção em formulários onde só instâncias ativas são válidas
 */
export function useConnectedWhatsAppInstances() {
  return useWhatsAppInstances({
    onlyConnected: true,
    includeConnecting: false,
  });
}

/**
 * Hook para buscar instâncias disponíveis para configuração
 * Inclui instâncias conectadas e em processo de conexão
 */
export function useAvailableWhatsAppInstances() {
  return useWhatsAppInstances({
    onlyConnected: true,
    includeConnecting: true,
  });
}
