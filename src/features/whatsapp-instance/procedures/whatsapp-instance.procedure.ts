// src/features/whatsapp-instance/procedures/whatsapp-instance.procedure.ts
/* eslint-disable prettier/prettier */
import { igniter } from '@/igniter';
import { Prisma } from '@prisma/client';
import {
  type CreateWhatsAppInstanceDTO,
  InstanceConnectionStatus,
  type WhatsAppInstanceFilters,
  type WhatsAppInstanceStats,
} from '../whatsapp-instance.types';

// Interface para Evolution API
interface EvolutionApiService {
  createInstance: (data: {
    instanceName: string;
    qrcode?: boolean;
    integration?: string;
    webhook?: {
      url: string;
      byEvents?: boolean;
      base64?: boolean;
      events?: string[];
    };
  }) => Promise<any>;
  getInstanceStatus: (instanceName: string) => Promise<any>;
  deleteInstance: (instanceName: string) => Promise<any>;
  restartInstance: (instanceName: string) => Promise<any>;
  logoutInstance: (instanceName: string) => Promise<any>;
  listInstances: () => Promise<any[]>; // Adicionado para listar instâncias
  setProxy: (data: {
    instanceName: string;
    enabled: boolean;
    host: string;
    port: string;
    protocol: 'http' | 'https' | 'socks4' | 'socks5';
    username?: string;
    password?: string;
  }) => Promise<any>;
  findProxy: (data: { instanceName: string }) => Promise<any>;
  connectInstance: (instanceName: string) => Promise<any>;
}

// Implementação mock para client-side (nunca será executada)
const createEvolutionApiService = (): EvolutionApiService => {
  const isServer = typeof window === 'undefined';

  if (!isServer) {
    // No cliente, retorna funções que nunca serão executadas
    return {
      createInstance: async () => { throw new Error('Só executável no servidor') },
      getInstanceStatus: async () => { throw new Error('Só executável no servidor') },
      deleteInstance: async () => { throw new Error('Só executável no servidor') },
      restartInstance: async () => { throw new Error('Só executável no servidor') },
      logoutInstance: async () => { throw new Error('Só executável no servidor') },
      listInstances: async () => { throw new Error('Só executável no servidor') }, // Mock para listInstances
      setProxy: async () => { throw new Error('Só executável no servidor') },
      findProxy: async () => { throw new Error('Só executável no servidor') },
      connectInstance: async () => { throw new Error('Só executável no servidor') }, // Mock para connectInstance
    };
  }

  // No servidor, importa e usa o plugin real
  return {
    createInstance: async (data) => {
      const { evolutionApi } = await import('@/plugins/evolution-api.plugin');
      return await evolutionApi.actions.createInstance.handler({
        config: {},
        input: {
          instanceName: data.instanceName,
          qrcode: data.qrcode ?? true, // Default para true se não fornecido
          integration: data.integration ?? 'WHATSAPP-BAILEYS', // Default integration
        },
      });
    },
    getInstanceStatus: async (instanceName) => {
      const { evolutionApi } = await import('@/plugins/evolution-api.plugin');
      return await evolutionApi.actions.connectionStatus.handler({
        config: {},
        input: { instanceName },
      });
    },
    deleteInstance: async (instanceName) => {
      const { evolutionApi } = await import('@/plugins/evolution-api.plugin');
      return await evolutionApi.actions.deleteInstance.handler({
        config: {},
        input: { instanceName },
      });
    },
    restartInstance: async (instanceName) => {
      const { evolutionApi } = await import('@/plugins/evolution-api.plugin');
      return await evolutionApi.actions.restartInstance.handler({
        config: {},
        input: { instanceName },
      });
    },
    logoutInstance: async (instanceName) => {
      const { evolutionApi } = await import('@/plugins/evolution-api.plugin');
      return await evolutionApi.actions.logoutInstance.handler({
        config: {},
        input: { instanceName },
      });
    },
    listInstances: async () => {
      const { evolutionApi } = await import('@/plugins/evolution-api.plugin');
      return await evolutionApi.actions.listInstances.handler({
        config: {},
        input: {},
      });
    },
    setProxy: async (data) => {
      const { evolutionApi } = await import('@/plugins/evolution-api.plugin');
      return await evolutionApi.actions.setProxy.handler({
        config: {},
        input: data,
      });
    },
    findProxy: async (data) => {
      const { evolutionApi } = await import('@/plugins/evolution-api.plugin');
      return await evolutionApi.actions.findProxy.handler({
        config: {},
        input: data,
      });
    },
    connectInstance: async (instanceName) => {
      const { evolutionApi } = await import('@/plugins/evolution-api.plugin');
      return await evolutionApi.actions.connectInstance.handler({
        config: {},
        input: { instanceName },
      });
    },
  };
};

export const WhatsAppInstanceProcedure = igniter.procedure({
  name: 'WhatsAppInstanceProcedure',
  handler: async (_, { context }) => {
    return {
      whatsAppInstance: {
        // Listar instâncias com paginação, filtros e contadores
        list: async (
          filters: WhatsAppInstanceFilters & { organizationId: string },
        ) => {
          const {
            organizationId,
            status,
            search,
            page = 1,
            limit = 20,
            sortBy,
            sortOrder,
          } = filters;

          // Garantir que page e limit sejam números
          const pageNumber = typeof page === 'string' ? parseInt(page, 10) : page;
          const limitNumber = typeof limit === 'string' ? parseInt(limit, 10) : limit;

          // Constrói where clause do Prisma
          const where: Prisma.WhatsAppInstanceWhereInput = {
            organizationId,
            ...(status && status !== 'all' && { status }),
            ...(search && {
              OR: [
                { instanceName: { contains: search, mode: 'insensitive' } },
                { profileName: { contains: search, mode: 'insensitive' } },
              ],
            }),
          };

          // Query otimizada: usa Promise.all para paralelizar contadores e lista
          const [instances, total, stats] = await Promise.all([
            // Lista principal com paginação
            context.providers.database.whatsAppInstance.findMany({
              where,
              skip: (pageNumber - 1) * limitNumber,
              take: limitNumber,
              orderBy: sortBy
                ? { [sortBy]: sortOrder || 'desc' }
                : { createdAt: 'desc' },
              select: {
                id: true,
                instanceName: true,
                status: true,
                ownerJid: true,
                profileName: true,
                profilePicUrl: true,
                lastSeen: true,
                metadata: true,
                organizationId: true,
                userId: true,
                createdById: true,
                createdAt: true,
                updatedAt: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
                createdBy: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
              },
            }),

            // Total geral para paginação
            context.providers.database.whatsAppInstance.count({ where }),

            // Contadores por status (usando groupBy do Prisma)
            context.providers.database.whatsAppInstance.groupBy({
              by: ['status'],
              where: { organizationId },
              _count: true,
            }),
          ]);

          // Processa contadores
          const statsMap = stats.reduce(
            (acc, curr) => {
              acc[curr.status] = curr._count;
              return acc;
            },
            {} as Record<string, number>,
          );

          return {
            data: instances,
            pagination: {
              page: pageNumber,
              limit: limitNumber,
              total,
              pages: Math.ceil(total / limitNumber),
            },
            stats: {
              total,
              connected: statsMap[InstanceConnectionStatus.OPEN] || 0,
              connecting: statsMap[InstanceConnectionStatus.CONNECTING] || 0,
              disconnected: statsMap[InstanceConnectionStatus.CLOSE] || 0,
            },
          };
        },

        // Criar nova instância
        create: async (
          data: CreateWhatsAppInstanceDTO & {
            organizationId: string;
            userId: string;
            createdById: string;
            integration?: string; // Adicionado para permitir passar o tipo de integração
          },
        ) => {
          console.log('[WhatsApp Instance Procedure] Iniciando criação:', data);

          try {
            // Verificar limite do plano antes de criar
            const existingInstances = await context.providers.database.whatsAppInstance.count({
              where: { organizationId: data.organizationId },
            });

            // Buscar informações do plano atual da organização
            const organization = await context.providers.database.organization.findUnique({
              where: { id: data.organizationId },
              include: {
                customer: {
                  include: {
                    subscriptions: {
                      where: {
                        status: {
                          in: ['active', 'trialing'],
                        },
                      },
                      include: {
                        price: {
                          include: {
                            plan: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            });

            // Determinar limite baseado no plano (fallback para free se não houver subscription)
            let planLimit = 2; // Plano free padrão
            if (organization?.customer?.subscriptions?.[0]?.price?.plan?.metadata) {
              const metadata = organization.customer.subscriptions[0].price.plan.metadata as any;
              const whatsappFeature = metadata.features?.find((f: any) => f.slug === 'whatsapp-instances');
              if (whatsappFeature?.limit) {
                planLimit = whatsappFeature.limit;
              }
            }

            if (existingInstances >= planLimit) {
              throw new Error(`Limite de instâncias excedido para o seu plano. Máximo permitido: ${planLimit}`);
            }

            // Criação na Evolution API
            console.log('[WhatsApp Instance Procedure] Chamando Evolution API...');

            // Configurar webhook URL para nosso endpoint
            const webhookUrl = process.env.NEXT_PUBLIC_APP_URL
              ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/evolution`
              : `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/webhooks/evolution`;

            const evolutionResponse =
              await createEvolutionApiService().createInstance({
                instanceName: data.instanceName,
                qrcode: true,
                integration: data.integration, // Passa o valor de integração do DTO
                webhook: {
                  url: webhookUrl,
                  byEvents: false,
                  base64: false,
                  events: [
                    'CONNECTION_UPDATE',
                    'QRCODE_UPDATED',
                    'MESSAGES_UPSERT',
                    'SEND_MESSAGE',
                    'INSTANCE_DELETE',
                  ],
                },
              });

            console.log('[WhatsApp Instance Procedure] Evolution API response:', evolutionResponse);

            // Criar no banco
            console.log('[WhatsApp Instance Procedure] Criando no banco de dados...');
            const instance =
              await context.providers.database.whatsAppInstance.create({
                data: {
                  instanceName: data.instanceName,
                  status: InstanceConnectionStatus.CONNECTING,
                  organizationId: data.organizationId,
                  userId: data.userId,
                  createdById: data.createdById,
                  metadata: evolutionResponse, // Armazena a resposta completa da Evolution API
                },
                include: {
                  user: true,
                  createdBy: true,
                },
              });

            console.log('[WhatsApp Instance Procedure] Instância criada no banco:', instance);

            // Iniciar processo de verificação de status
            setTimeout(async () => {
              try {
                // Usa instance.instanceName para verificar o status
                const status = await createEvolutionApiService().getInstanceStatus(
                  instance.instanceName, // Usa instanceName aqui
                );

                await context.providers.database.whatsAppInstance.update({
                  where: { id: instance.id },
                  data: {
                    status: status.state === 'open'
                      ? InstanceConnectionStatus.OPEN
                      : status.state === 'close'
                        ? InstanceConnectionStatus.CLOSE
                        : InstanceConnectionStatus.CONNECTING,
                    metadata: {
                      ...(typeof instance.metadata === 'object' && instance.metadata !== null ? instance.metadata : {}),
                      status, // Mescla as novas informações de status no metadata
                    },
                  },
                });
              } catch (error) {
                console.error('[Evolution API] Erro ao atualizar status da instância:', error);
              }
            }, 5000); // Verificar status após 5 segundos

            return instance;
          } catch (error) {
            console.error('[WhatsApp Instance Procedure] Erro na criação:', error);
            throw error;
          }
        },

        // Deletar instância
        delete: async ({
          id,
          organizationId,
        }: {
          id: string;
          organizationId: string;
        }) => {
          const instance =
            await context.providers.database.whatsAppInstance.findFirst({
              where: { id, organizationId },
            });

          if (!instance) {
            throw new Error('Instância não encontrada');
          }

          // Deletar na Evolution API usando instanceName
          await createEvolutionApiService().deleteInstance(instance.instanceName);

          // Deletar no banco
          await context.providers.database.whatsAppInstance.delete({
            where: { id },
          });
        },

        // Atualizar instância
        update: async ({
          id,
          organizationId,
          status,
          metadata,
        }: {
          id: string;
          organizationId: string;
          status?: InstanceConnectionStatus;
          metadata?: Record<string, any>;
        }) => {
          const instance =
            await context.providers.database.whatsAppInstance.findFirst({
              where: { id, organizationId },
            });

          if (!instance) {
            throw new Error('Instância não encontrada');
          }

          // Se mudou status, atualizar na Evolution API usando instanceName
          if (status) {
            if (status === InstanceConnectionStatus.CLOSE) {
              await createEvolutionApiService().logoutInstance(instance.instanceName);
            } else if (status === InstanceConnectionStatus.CONNECTING) {
              await createEvolutionApiService().restartInstance(instance.instanceName);
            }
          }

          // Atualizar no banco
          return context.providers.database.whatsAppInstance.update({
            where: { id },
            data: {
              status,
              metadata: metadata
                ? {
                  ...(typeof instance.metadata === 'object' &&
                    instance.metadata !== null
                    ? instance.metadata
                    : {}),
                  ...(typeof metadata === 'object' && metadata !== null
                    ? metadata
                    : {}),
                }
                : undefined,
            },
            include: {
              user: true,
              createdBy: true,
            },
          });
        },

        // Sincronizar status com Evolution API
        syncStatus: async ({
          id,
          organizationId,
        }: {
          id: string;
          organizationId: string;
        }) => {
          const instance =
            await context.providers.database.whatsAppInstance.findFirst({
              where: { id, organizationId },
            });

          if (!instance) {
            throw new Error('Instância não encontrada');
          }

          try {
            // Buscar status atual na Evolution API
            const evolutionStatus = await createEvolutionApiService().getInstanceStatus(
              instance.instanceName,
            );

            console.log('[WhatsApp Instance Procedure] Status da Evolution API:', evolutionStatus);

            // Mapear status da Evolution API para nosso enum
            let newStatus: InstanceConnectionStatus;
            switch (evolutionStatus.state) {
              case 'open':
                newStatus = InstanceConnectionStatus.OPEN;
                break;
              case 'close':
                newStatus = InstanceConnectionStatus.CLOSE;
                break;
              case 'connecting':
                newStatus = InstanceConnectionStatus.CONNECTING;
                break;
              default:
                // Se o status não é reconhecido, mantém o atual
                newStatus = instance.status as InstanceConnectionStatus;
            }

            // Atualizar no banco
            const updatedInstance = await context.providers.database.whatsAppInstance.update({
              where: { id },
              data: {
                status: newStatus,
                metadata: {
                  ...(typeof instance.metadata === 'object' &&
                    instance.metadata !== null
                    ? instance.metadata
                    : {}),
                  lastSync: {
                    timestamp: new Date().toISOString(),
                    evolutionStatus,
                  },
                },
                // Atualizar informações do perfil se disponível
                ...(evolutionStatus.profileName && { profileName: evolutionStatus.profileName }),
                ...(evolutionStatus.profilePicUrl && { profilePicUrl: evolutionStatus.profilePicUrl }),
                ...(evolutionStatus.owner && { ownerJid: evolutionStatus.owner }),
              },
              include: {
                user: true,
                createdBy: true,
              },
            });

            console.log('[WhatsApp Instance Procedure] Status sincronizado:', newStatus);
            return updatedInstance;
          } catch (error: any) {
            console.error('[WhatsApp Instance Procedure] Erro ao sincronizar status:', error);
            
            // Verificar se é erro 404 (instância não existe na Evolution API)
            if (error.status === 404 || error.response?.status === 404) {
              console.log('[WhatsApp Instance Procedure] Instância não existe na Evolution API, marcando como CLOSE');
              
              // Marcar instância como CLOSE no banco local
              const updatedInstance = await context.providers.database.whatsAppInstance.update({
                where: { id },
                data: {
                  status: InstanceConnectionStatus.CLOSE,
                  metadata: {
                    ...(typeof instance.metadata === 'object' &&
                      instance.metadata !== null
                      ? instance.metadata
                      : {}),
                    lastSync: {
                      timestamp: new Date().toISOString(),
                      error: 'Instância não encontrada na Evolution API',
                      errorCode: 404,
                    },
                  },
                },
                include: {
                  user: true,
                  createdBy: true,
                },
              });
              
              return updatedInstance;
            }
            
            throw new Error('Erro ao sincronizar com a Evolution API');
          }
        },

        // Sincronizar todas as instâncias da organização com Evolution API
        syncAllInstances: async (organizationId: string) => {
          try {
            console.log('[WhatsApp Instance Procedure] Sincronizando todas as instâncias...');

            // Buscar todas as instâncias da organização no banco
            const localInstances = await context.providers.database.whatsAppInstance.findMany({
              where: { organizationId },
            });

            // Buscar todas as instâncias da Evolution API
            const evolutionInstances = await createEvolutionApiService().listInstances();
            console.log('[WhatsApp Instance Procedure] Instâncias da Evolution API:', evolutionInstances);

            const updatedInstances = [];

            // Sincronizar cada instância local com a Evolution API
            for (const localInstance of localInstances) {
              // A Evolution API retorna instâncias diretamente (não dentro de instance)
              // Encontrar a instância correspondente na Evolution API pelo nome
              const evolutionInstance = evolutionInstances.find(
                (evInstance: any) =>
                  evInstance.name === localInstance.instanceName ||
                  evInstance.id === localInstance.evolutionInstanceId
              );

              if (evolutionInstance) {
                console.log('[WhatsApp Instance Procedure] Encontrada instância na Evolution API:', {
                  name: evolutionInstance.name,
                  status: evolutionInstance.connectionStatus,
                  ownerJid: evolutionInstance.ownerJid,
                  profileName: evolutionInstance.profileName,
                  profilePicUrl: evolutionInstance.profilePicUrl,
                });

                // Mapear status da Evolution API
                let newStatus: InstanceConnectionStatus;
                switch (evolutionInstance.connectionStatus) {
                  case 'open':
                    newStatus = InstanceConnectionStatus.OPEN;
                    break;
                  case 'close':
                    newStatus = InstanceConnectionStatus.CLOSE;
                    break;
                  case 'connecting':
                    newStatus = InstanceConnectionStatus.CONNECTING;
                    break;
                  default:
                    newStatus = localInstance.status as InstanceConnectionStatus;
                }

                // Extrair número limpo do ownerJid (remover @s.whatsapp.net)
                const cleanOwnerJid = evolutionInstance.ownerJid
                  ? evolutionInstance.ownerJid.replace('@s.whatsapp.net', '')
                  : null;

                // Atualizar instância no banco
                const updatedInstance = await context.providers.database.whatsAppInstance.update({
                  where: { id: localInstance.id },
                  data: {
                    status: newStatus,
                    evolutionInstanceId: evolutionInstance.id,
                    profileName: evolutionInstance.profileName || localInstance.profileName,
                    profilePicUrl: evolutionInstance.profilePicUrl || localInstance.profilePicUrl,
                    ownerJid: cleanOwnerJid || localInstance.ownerJid,
                    lastSeen: new Date(),
                    metadata: {
                      ...(typeof localInstance.metadata === 'object' && localInstance.metadata !== null
                        ? localInstance.metadata
                        : {}),
                      lastFullSync: {
                        timestamp: new Date().toISOString(),
                        evolutionData: evolutionInstance,
                      },
                    },
                  },
                  include: {
                    user: true,
                    createdBy: true,
                  },
                });

                updatedInstances.push(updatedInstance);
                console.log('[WhatsApp Instance Procedure] Instância atualizada:', {
                  id: updatedInstance.id,
                  instanceName: updatedInstance.instanceName,
                  status: updatedInstance.status,
                  profileName: updatedInstance.profileName,
                  ownerJid: updatedInstance.ownerJid,
                });
              } else {
                console.log('[WhatsApp Instance Procedure] Instância não encontrada na Evolution API:', localInstance.instanceName);
              }
            }

            console.log(`[WhatsApp Instance Procedure] ${updatedInstances.length} instâncias sincronizadas`);
            return updatedInstances;

          } catch (error) {
            console.error('[WhatsApp Instance Procedure] Erro ao sincronizar todas as instâncias:', error);
            throw new Error('Erro ao sincronizar com a Evolution API');
          }
        },

        // Obter stats/contadores
        getStats: async (
          organizationId: string,
        ): Promise<WhatsAppInstanceStats> => {
          const stats =
            await context.providers.database.whatsAppInstance.groupBy({
              by: ['status'],
              where: { organizationId },
              _count: true,
            });

          const statsMap = stats.reduce(
            (acc, curr) => {
              acc[curr.status] = curr._count;
              return acc;
            },
            {} as Record<string, number>,
          );

          const total = Object.values(statsMap).reduce((a, b) => a + b, 0);

          return {
            total,
            connected: statsMap[InstanceConnectionStatus.OPEN] || 0,
            connecting: statsMap[InstanceConnectionStatus.CONNECTING] || 0,
            disconnected: statsMap[InstanceConnectionStatus.CLOSE] || 0,
          };
        },

        // Configurar proxy para instância
        setProxy: async (data: {
          id: string;
          organizationId: string;
          proxyConfig: {
            enabled: boolean;
            host: string;
            port: string;
            protocol: 'http' | 'https' | 'socks4' | 'socks5';
            username?: string;
            password?: string;
          };
        }) => {
          // Verificar se a instância existe e pertence à organização
          const instance = await context.providers.database.whatsAppInstance.findFirst({
            where: {
              id: data.id,
              organizationId: data.organizationId,
            },
          });

          if (!instance) {
            throw new Error('Instância não encontrada');
          }

          // Configurar proxy via Evolution API
          const evolutionApi = createEvolutionApiService();
          try {
            const result = await evolutionApi.setProxy({
              instanceName: instance.instanceName,
              ...data.proxyConfig,
            });

            // Atualizar metadata da instância com informações do proxy
            const updatedInstance = await context.providers.database.whatsAppInstance.update({
              where: { id: data.id },
              data: {
                metadata: {
                  ...(instance.metadata as Record<string, any> || {}),
                  proxy: {
                    enabled: data.proxyConfig.enabled,
                    host: data.proxyConfig.host,
                    port: data.proxyConfig.port,
                    protocol: data.proxyConfig.protocol,
                    username: data.proxyConfig.username,
                    configuredAt: new Date().toISOString(),
                  },
                },
              },
            });

            return {
              success: true,
              message: 'Proxy configurado com sucesso',
              data: updatedInstance,
              evolutionResponse: result,
            };
          } catch (error: any) {
            console.error('[WhatsApp Instance] Erro ao configurar proxy:', error);
            throw new Error(`Erro ao configurar proxy: ${error.message}`);
          }
        },

        // Obter configuração de proxy da instância
        getProxy: async (data: { id: string; organizationId: string }) => {
          // Verificar se a instância existe e pertence à organização
          const instance = await context.providers.database.whatsAppInstance.findFirst({
            where: {
              id: data.id,
              organizationId: data.organizationId,
            },
          });

          if (!instance) {
            throw new Error('Instância não encontrada');
          }

          // Buscar configuração do proxy via Evolution API
          const evolutionApi = createEvolutionApiService();
          try {
            const result = await evolutionApi.findProxy({
              instanceName: instance.instanceName,
            });

            return {
              success: true,
              hasProxy: !!result?.enabled,
              config: result,
              localMetadata: (instance.metadata as Record<string, any>)?.proxy || null,
            };
          } catch (error: any) {
            console.error('[WhatsApp Instance] Erro ao buscar proxy:', error);
            // Se não conseguir buscar da API, retorna apenas dados locais
            const localProxy = (instance.metadata as Record<string, any>)?.proxy || null;
            return {
              success: false,
              hasProxy: !!localProxy?.enabled,
              config: null,
              localMetadata: localProxy,
              error: error.message,
            };
          }
        },

        // Conectar instância e obter QR Code
        connectInstance: async (data: { id: string; organizationId: string }) => {
          // Verificar se a instância existe e pertence à organização
          const instance = await context.providers.database.whatsAppInstance.findFirst({
            where: {
              id: data.id,
              organizationId: data.organizationId,
            },
          });

          if (!instance) {
            throw new Error('Instância não encontrada');
          }

          // Verificar se a instância pode ser conectada
          if (instance.status === InstanceConnectionStatus.OPEN) {
            throw new Error('Instância já está conectada');
          }

          try {
            console.log('[WhatsApp Instance] Conectando instância:', instance.instanceName);

            // Chamar Evolution API para conectar a instância
            const evolutionApi = createEvolutionApiService();
            const connectionResult = await evolutionApi.connectInstance(instance.instanceName);

            console.log('[WhatsApp Instance] Resultado da conexão:', connectionResult);

            // Verificar se há QR Code na resposta
            // A Evolution API retorna o QR Code diretamente no objeto principal
            const hasQrCode = !!(connectionResult?.base64 || connectionResult?.qrcode?.base64);
            const qrCodeData = connectionResult?.qrcode || connectionResult;

            console.log('[WhatsApp Instance] Análise do QR Code:', {
              hasQrCode,
              qrCodeData,
              connectionResultKeys: Object.keys(connectionResult || {}),
              qrcodeBase64: connectionResult?.qrcode?.base64,
              directBase64: connectionResult?.base64,
              base64Length: connectionResult?.base64?.length || 0,
            });

            // Atualizar status da instância para "connecting"
            const updatedInstance = await context.providers.database.whatsAppInstance.update({
              where: { id: data.id },
              data: {
                status: InstanceConnectionStatus.CONNECTING,
                metadata: {
                  ...(instance.metadata as Record<string, any> || {}),
                  lastConnectionAttempt: {
                    timestamp: new Date().toISOString(),
                    evolutionResponse: connectionResult,
                  },
                  // Armazenar QR Code se disponível
                  ...(hasQrCode && {
                    qrcode: {
                      base64: connectionResult?.base64 || connectionResult?.qrcode?.base64,
                      code: connectionResult?.code || connectionResult?.qrcode?.code || null,
                    },
                  }),
                },
              },
              include: {
                user: true,
                createdBy: true,
              },
            });

            console.log('[WhatsApp Instance] Instância atualizada:', {
              id: updatedInstance.id,
              status: updatedInstance.status,
              hasQrCode,
              qrCodeData: hasQrCode ? 'disponível' : 'não disponível',
              metadataQrCode: (updatedInstance.metadata as any)?.qrcode ? 'armazenado' : 'não armazenado',
            });

            return {
              success: true,
              message: hasQrCode ? 'QR Code gerado com sucesso' : 'Instância conectada com sucesso',
              data: updatedInstance,
              hasQrCode,
              qrCode: hasQrCode ? {
                base64: qrCodeData.base64,
                code: qrCodeData.code || null,
              } : null,
              evolutionResponse: connectionResult,
            };
          } catch (error: any) {
            console.error('[WhatsApp Instance] Erro ao conectar instância:', error);

            // Atualizar status para "close" em caso de erro
            await context.providers.database.whatsAppInstance.update({
              where: { id: data.id },
              data: {
                status: InstanceConnectionStatus.CLOSE,
                metadata: {
                  ...(instance.metadata as Record<string, any> || {}),
                  lastConnectionError: {
                    timestamp: new Date().toISOString(),
                    error: error.message,
                  },
                },
              },
            });

            throw new Error(`Erro ao conectar instância: ${error.message}`);
          }
        },
      },
    };
  },
});
