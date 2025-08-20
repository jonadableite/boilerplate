// src/plugins/evolution-api.plugin.ts
import { PluginManager } from '@/@saas-boilerplate/providers/plugin-manager/provider'
import axios from 'axios'
import { z } from 'zod'

// Verificar se estamos no servidor
const isServer = typeof window === 'undefined'

// Só executa no servidor
let EVOLUTION_API_URL: string | undefined
let EVOLUTION_API_KEY: string | undefined

if (isServer) {
  EVOLUTION_API_URL = process.env.EVOLUTION_API_URL
  EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY

  // Verificação das variáveis de ambiente apenas no servidor
  if (!EVOLUTION_API_URL) {
    console.error('[Evolution API] EVOLUTION_API_URL não está definida')
    throw new Error(
      '[Evolution API] EVOLUTION_API_URL não está definida no arquivo .env.local',
    )
  }

  if (!EVOLUTION_API_KEY) {
    console.error('[Evolution API] EVOLUTION_API_KEY não está definida')
    throw new Error(
      '[Evolution API] EVOLUTION_API_KEY não está definida no arquivo .env.local',
    )
  }

  console.log('[Evolution API] Plugin inicializado com sucesso:', {
    url: EVOLUTION_API_URL,
    hasKey: !!EVOLUTION_API_KEY,
  })
} else {
  // No cliente, apenas define valores vazios
  EVOLUTION_API_URL = ''
  EVOLUTION_API_KEY = ''
}

// Função auxiliar para criar um cliente Axios autenticado
const createEvolutionApiClient = () => {
  if (!isServer) {
    throw new Error('Esta ação só pode ser executada no servidor')
  }
  return axios.create({
    baseURL: EVOLUTION_API_URL,
    headers: {
      'Content-Type': 'application/json',
      apikey: EVOLUTION_API_KEY,
    },
  })
}

export const evolutionApi = PluginManager.plugin({
  slug: 'evolutionApi',
  name: 'Evolution API',
  schema: z.object({}),
  metadata: {
    verified: true,
    published: true,
    logo: 'https://meta-q.cdn.bubble.io/f1735656025985x589899456761148800/evolution-logo.png',
    description:
      'Complete WhatsApp Bot management with Evolution API v2. Create instances, send messages, manage groups, configure webhooks, and automate WhatsApp interactions with full API control.',
    category: 'communication',
    developer: 'Evolution API',
    screenshots: [],
    website: 'https://evolution-api.com',
    links: {
      install: 'https://doc.evolution-api.com/v2/pt/install/',
      documentation: 'https://doc.evolution-api.com/v2/',
    },
  },
  actions: {
    // Gerenciamento de Instâncias
    listInstances: {
      name: 'listInstances',
      description: 'Lista todas as instâncias do WhatsApp.',
      schema: z.object({
        instanceName: z
          .string()
          .optional()
          .describe('Filtrar por nome da instância'),
        instanceId: z
          .string()
          .optional()
          .describe('Filtrar por ID da instância'),
      }),
      handler: async ({ input }) => {
        const client = createEvolutionApiClient()
        const params: any = {}
        if (input.instanceName) {
          params.instanceName = input.instanceName
        }
        if (input.instanceId) {
          params.instanceId = input.instanceId
        }
        try {
          const response = await client.get('/instance/fetchInstances', {
            params,
          })
          return response.data
        } catch (error: any) {
          console.error(
            '[Evolution API] Erro ao listar instâncias:',
            error.response?.data || error.message,
          )
          throw error
        }
      },
    },

    createInstance: {
      name: 'createInstance',
      description:
        'Cria uma nova instância do WhatsApp para operações de bot. Configura as definições da instância e inicializa a conexão do WhatsApp.',
      schema: z.object({
        instanceName: z.string().describe('Nome para a nova instância'),
        token: z
          .string()
          .optional()
          .describe('Token de autenticação da instância'),
        qrcode: z
          .boolean()
          .optional()
          .default(true)
          .describe('Gerar QR code para conexão'),
        integration: z
          .enum(['WHATSAPP-BAILEYS', 'WHATSAPP-BUSINESS', 'EVOLUTION'])
          .optional()
          .default('WHATSAPP-BAILEYS')
          .describe(
            'Tipo de integração (WHATSAPP-BAILEYS | WHATSAPP-BUSINESS | EVOLUTION)',
          ),
        alwaysOnline: z
          .boolean()
          .optional()
          .describe('Manter instância sempre online'),
        readMessages: z
          .boolean()
          .optional()
          .describe('Marcar mensagens como lidas automaticamente'),
        readStatus: z
          .boolean()
          .optional()
          .describe('Marcar status como lido automaticamente'),
        webhook: z
          .object({
            url: z.string().url().describe('URL do webhook'),
            byEvents: z
              .boolean()
              .optional()
              .describe('Enviar eventos individualmente'),
            base64: z
              .boolean()
              .optional()
              .describe('Codificar payload em base64'),
            headers: z
              .record(z.string())
              .optional()
              .describe('Cabeçalhos personalizados para o webhook'),
            events: z
              .array(z.string()) // Pode ser mais específico com um enum de tipos de eventos
              .optional()
              .describe('Lista de eventos para assinar'),
          })
          .optional()
          .describe('Configuração do webhook'),
        rabbitmq: z
          .object({
            enabled: z
              .boolean()
              .optional()
              .default(true)
              .describe('Habilitar RabbitMQ'),
            events: z
              .array(z.string())
              .optional()
              .describe('Lista de eventos para RabbitMQ'),
          })
          .optional()
          .describe('Configuração do RabbitMQ'),
      }),
      handler: async ({ input }) => {
        const client = createEvolutionApiClient()
        const payload = {
          instanceName: input.instanceName,
          token: input.token,
          qrcode: input.qrcode,
          integration: input.integration,
          settings: {
            alwaysOnline: input.alwaysOnline,
            readMessages: input.readMessages,
            readStatus: input.readStatus,
          },
          webhook: input.webhook,
          rabbitmq: input.rabbitmq,
        }
        // Filtra valores indefinidos para não enviar chaves vazias ou nulas
        const filteredPayload = Object.fromEntries(
          Object.entries(payload).filter(([, value]) => value !== undefined),
        ) as typeof payload

        if (
          filteredPayload.settings &&
          Object.keys(filteredPayload.settings ?? {}).length === 0
        ) {
          delete (filteredPayload as any).settings
        }

        try {
          const response = await client.post(
            '/instance/create',
            filteredPayload,
          )
          console.log('[Evolution API] Instância criada')
          return response.data
        } catch (error: any) {
          console.error(
            '[Evolution API] Erro ao criar instância:',
            error.response?.data || error.message,
          )
          throw error
        }
      },
    },

    connectionStatus: {
      name: 'connectionStatus',
      description:
        'Verifica o status de conexão da sua instância do WhatsApp. Essencial para monitorar a saúde e conectividade do bot.',
      schema: z.object({
        instanceName: z.string().describe('Nome da instância do WhatsApp'),
      }),
      handler: async ({ input }) => {
        try {
          const client = createEvolutionApiClient()
          const response = await client.get(
            `/instance/connectionState/${input.instanceName}`,
          )
          console.log('[Evolution API] Status da instância verificado')
          return response.data
        } catch (error: any) {
          console.error(
            '[Evolution API] Erro ao verificar status da instância:',
            error.response?.data || error.message,
          )
          throw error
        }
      },
    },

    instanceConnect: {
      name: 'instanceConnect',
      description:
        'Inicia a conexão para uma instância do WhatsApp, geralmente para obter um QR code ou estabelecer a sessão.',
      schema: z.object({
        instanceName: z.string().describe('Nome da instância do WhatsApp'),
        number: z
          .string()
          .optional()
          .describe(
            'Número do destinatário com Código do País (opcional, para tipos de conexão específicos)',
          ),
      }),
      handler: async ({ input }) => {
        try {
          const client = createEvolutionApiClient()
          const params: any = {}
          if (input.number) {
            params.number = input.number
          }
          const response = await client.get(
            `/instance/connect/${input.instanceName}`,
            { params },
          )
          console.log('[Evolution API] Conexão da instância iniciada')
          return response.data
        } catch (error: any) {
          console.error(
            '[Evolution API] Erro ao iniciar conexão da instância:',
            error.response?.data || error.message,
          )
          throw error
        }
      },
    },

    restartInstance: {
      name: 'restartInstance',
      description: 'Reinicia uma instância específica do WhatsApp.',
      schema: z.object({
        instanceName: z.string().describe('Nome da instância do WhatsApp'),
      }),
      handler: async ({ input }) => {
        try {
          const client = createEvolutionApiClient()
          const response = await client.post(
            `/instance/restart/${input.instanceName}`,
          )
          console.log('[Evolution API] Instância reiniciada')
          return response.data
        } catch (error: any) {
          console.error(
            '[Evolution API] Erro ao reiniciar instância:',
            error.response?.data || error.message,
          )
          throw error
        }
      },
    },

    setPresence: {
      name: 'setPresence',
      description:
        'Define o status de presença de uma instância do WhatsApp (ex: disponível, indisponível).',
      schema: z.object({
        instanceName: z.string().describe('Nome da instância do WhatsApp'),
        presence: z
          .enum(['available', 'unavailable'])
          .describe('Status de presença'),
      }),
      handler: async ({ input }) => {
        try {
          const client = createEvolutionApiClient()
          const response = await client.post(
            `/instance/setPresence/${input.instanceName}`,
            { presence: input.presence },
          )
          console.log('[Evolution API] Presença definida')
          return response.data
        } catch (error: any) {
          console.error(
            '[Evolution API] Erro ao definir presença:',
            error.response?.data || error.message,
          )
          throw error
        }
      },
    },

    logoutInstance: {
      name: 'logoutInstance',
      description:
        'Desconecta uma instância do WhatsApp, encerrando sua sessão.',
      schema: z.object({
        instanceName: z.string().describe('Nome da instância do WhatsApp'),
      }),
      handler: async ({ input }) => {
        try {
          const client = createEvolutionApiClient()
          const response = await client.delete(
            `/instance/logout/${input.instanceName}`,
          )
          console.log('[Evolution API] Instância desconectada')
          return response.data
        } catch (error: any) {
          console.error(
            '[Evolution API] Erro ao desconectar instância:',
            error.response?.data || error.message,
          )
          throw error
        }
      },
    },

    deleteInstance: {
      name: 'deleteInstance',
      description: 'Exclui uma instância específica do WhatsApp.',
      schema: z.object({
        instanceName: z.string().describe('Nome da instância do WhatsApp'),
      }),
      handler: async ({ input }) => {
        try {
          const client = createEvolutionApiClient()
          const response = await client.delete(
            `/instance/delete/${input.instanceName}`,
          )
          console.log('[Evolution API] Instância excluída')
          return response.data
        } catch (error: any) {
          console.error(
            '[Evolution API] Erro ao excluir instância:',
            error.response?.data || error.message,
          )
          throw error
        }
      },
    },

    // Envio de Mensagens
    sendText: {
      name: 'sendText',
      description: 'Envia uma mensagem de texto para um destinatário.',
      schema: z.object({
        instanceName: z.string().describe('Nome da instância do WhatsApp'),
        number: z
          .string()
          .describe(
            'Número do destinatário com Código do País (ex: 559999999999)',
          ),
        text: z.string().describe('O conteúdo do texto da mensagem'),
        delay: z
          .number()
          .optional()
          .describe('Atraso em milissegundos antes de enviar'),
        quoted: z
          .object({
            key: z.object({ id: z.string() }).optional(),
            message: z.object({ conversation: z.string() }).optional(),
          })
          .optional()
          .describe('Payload ou ID da mensagem citada'),
        linkPreview: z
          .boolean()
          .optional()
          .describe('Habilitar pré-visualização de link'),
        mentionsEveryOne: z
          .boolean()
          .optional()
          .describe('Mencionar todos em um grupo'),
        mentioned: z
          .array(z.string())
          .optional()
          .describe('Array de números para mencionar'),
      }),
      handler: async ({ input }) => {
        try {
          const client = createEvolutionApiClient()
          const payload = {
            number: input.number,
            text: input.text,
            delay: input.delay,
            quoted: input.quoted,
            linkPreview: input.linkPreview,
            mentionsEveryOne: input.mentionsEveryOne,
            mentioned: input.mentioned,
          }
          const response = await client.post(
            `/message/sendText/${input.instanceName}`,
            payload,
          )
          console.log('[Evolution API] Mensagem de texto enviada')
          return response.data
        } catch (error: any) {
          console.error(
            '[Evolution API] Erro ao enviar mensagem de texto:',
            error.response?.data || error.message,
          )
          throw error
        }
      },
    },

    sendMedia: {
      name: 'sendMedia',
      description: 'Envia uma mensagem de imagem, vídeo ou documento.',
      schema: z.object({
        instanceName: z.string().describe('Nome da instância do WhatsApp'),
        number: z
          .string()
          .describe(
            'Número do destinatário com Código do País (ex: 559999999999)',
          ),
        mediatype: z
          .enum(['image', 'video', 'document'])
          .describe('Tipo de mídia'),
        mimetype: z
          .string()
          .describe(
            'Tipo MIME da mídia (ex: image/png, video/mp4, application/pdf)',
          ),
        caption: z.string().optional().describe('Legenda para a mídia'),
        media: z
          .string()
          .describe('URL ou dados de mídia codificados em base64'),
        fileName: z
          .string()
          .optional()
          .describe('Nome do arquivo para a mídia'),
        delay: z
          .number()
          .optional()
          .describe('Atraso em milissegundos antes de enviar'),
        quoted: z
          .object({
            key: z.object({ id: z.string() }).optional(),
            message: z.object({ conversation: z.string() }).optional(),
          })
          .optional()
          .describe('Payload ou ID da mensagem citada'),
        mentionsEveryOne: z
          .boolean()
          .optional()
          .describe('Mencionar todos em um grupo'),
        mentioned: z
          .array(z.string())
          .optional()
          .describe('Array de números para mencionar'),
      }),
      handler: async ({ input }) => {
        try {
          const client = createEvolutionApiClient()
          const payload = {
            number: input.number,
            mediatype: input.mediatype,
            mimetype: input.mimetype,
            caption: input.caption,
            media: input.media,
            fileName: input.fileName,
            delay: input.delay,
            quoted: input.quoted,
            mentionsEveryOne: input.mentionsEveryOne,
            mentioned: input.mentioned,
          }
          const response = await client.post(
            `/message/sendMedia/${input.instanceName}`,
            payload,
          )
          console.log('[Evolution API] Mensagem de mídia enviada')
          return response.data
        } catch (error: any) {
          console.error(
            '[Evolution API] Erro ao enviar mensagem de mídia:',
            error.response?.data || error.message,
          )
          throw error
        }
      },
    },

    sendAudio: {
      name: 'sendAudio',
      description: 'Envia uma mensagem de áudio narrado.',
      schema: z.object({
        instanceName: z.string().describe('Nome da instância do WhatsApp'),
        number: z
          .string()
          .describe(
            'Número do destinatário com Código do País (ex: 559999999999)',
          ),
        audio: z
          .string()
          .describe('URL ou dados de áudio codificados em base64'),
        delay: z
          .number()
          .optional()
          .describe('Atraso em milissegundos antes de enviar'),
        quoted: z
          .object({
            key: z.object({ id: z.string() }).optional(),
            message: z.object({ conversation: z.string() }).optional(),
          })
          .optional()
          .describe('Payload ou ID da mensagem citada'),
        mentionsEveryOne: z
          .boolean()
          .optional()
          .describe('Mencionar todos em um grupo'),
        mentioned: z
          .array(z.string())
          .optional()
          .describe('Array de números para mencionar'),
        encoding: z
          .boolean()
          .optional()
          .describe('Habilitar codificação para o áudio'),
      }),
      handler: async ({ input }) => {
        try {
          const client = createEvolutionApiClient()
          const payload = {
            number: input.number,
            audio: input.audio,
            delay: input.delay,
            quoted: input.quoted,
            mentionsEveryOne: input.mentionsEveryOne,
            mentioned: input.mentioned,
            encoding: input.encoding,
          }
          const response = await client.post(
            `/message/sendWhatsAppAudio/${input.instanceName}`,
            payload,
          )
          console.log('[Evolution API] Mensagem de áudio enviada')
          return response.data
        } catch (error: any) {
          console.error(
            '[Evolution API] Erro ao enviar mensagem de áudio:',
            error.response?.data || error.message,
          )
          throw error
        }
      },
    },

    sendButton: {
      name: 'sendButton',
      description: 'Envia uma mensagem com botões interativos.',
      schema: z.object({
        instanceName: z.string().describe('Nome da instância do WhatsApp'),
        number: z
          .string()
          .describe(
            'Número do destinatário com Código do País (ex: 559999999999)',
          ),
        title: z.string().describe('Título da mensagem do botão'),
        description: z
          .string()
          .describe('Texto de descrição para a mensagem do botão'),
        footer: z
          .string()
          .optional()
          .describe('Texto do rodapé para a mensagem do botão'),
        buttons: z
          .array(
            z.union([
              z.object({
                type: z.literal('reply'),
                displayText: z.string(),
                id: z.string(),
              }),
              z.object({
                type: z.literal('copy'),
                displayText: z.string(),
                copyCode: z.string(),
              }),
              z.object({
                type: z.literal('url'),
                displayText: z.string(),
                url: z.string().url(),
              }),
              z.object({
                type: z.literal('call'),
                displayText: z.string(),
                phoneNumber: z.string(),
              }),
              z.object({
                type: z.literal('pix'),
                currency: z.string(),
                name: z.string(),
                keyType: z.enum(['phone', 'email', 'cpf', 'cnpj', 'random']),
                key: z.string(),
              }),
            ]),
          )
          .min(1)
          .describe('Array de objetos de botão'),
        delay: z
          .number()
          .optional()
          .describe('Atraso em milissegundos antes de enviar'),
        quoted: z
          .object({
            key: z.object({ id: z.string() }).optional(),
            message: z.object({ conversation: z.string() }).optional(),
          })
          .optional()
          .describe('Payload ou ID da mensagem citada'),
        mentionsEveryOne: z
          .boolean()
          .optional()
          .describe('Mencionar todos em um grupo'),
        mentioned: z
          .array(z.string())
          .optional()
          .describe('Array de números para mencionar'),
      }),
      handler: async ({ input }) => {
        try {
          const client = createEvolutionApiClient()
          const payload = {
            number: input.number,
            title: input.title,
            description: input.description,
            footer: input.footer,
            buttons: input.buttons,
            delay: input.delay,
            quoted: input.quoted,
            mentionsEveryOne: input.mentionsEveryOne,
            mentioned: input.mentioned,
          }
          const response = await client.post(
            `/message/sendButtons/${input.instanceName}`,
            payload,
          )
          console.log('[Evolution API] Mensagem de botão enviada')
          return response.data
        } catch (error: any) {
          console.error(
            '[Evolution API] Erro ao enviar mensagem de botão:',
            error.response?.data || error.message,
          )
          throw error
        }
      },
    },

    sendList: {
      name: 'sendList',
      description: 'Envia uma mensagem com uma lista interativa.',
      schema: z.object({
        instanceName: z.string().describe('Nome da instância do WhatsApp'),
        number: z
          .string()
          .describe(
            'Número do destinatário com Código do País (ex: 559999999999)',
          ),
        title: z.string().describe('Título da mensagem da lista'),
        description: z
          .string()
          .describe('Texto de descrição para a mensagem da lista'),
        buttonText: z.string().describe('Texto para o botão que abre a lista'),
        footerText: z
          .string()
          .optional()
          .describe('Texto do rodapé para a mensagem da lista'),
        sections: z
          .array(
            z.object({
              title: z.string().describe('Título da seção'),
              rows: z
                .array(
                  z.object({
                    title: z.string().describe('Título da linha'),
                    description: z
                      .string()
                      .optional()
                      .describe('Descrição da linha'),
                    rowId: z.string().describe('ID único para a linha'),
                  }),
                )
                .min(1)
                .describe('Array de linhas dentro da seção'),
            }),
          )
          .min(1)
          .describe('Array de seções para a lista'),
        delay: z
          .number()
          .optional()
          .describe('Atraso em milissegundos antes de enviar'),
        quoted: z
          .object({
            key: z.object({ id: z.string() }).optional(),
            message: z.object({ conversation: z.string() }).optional(),
          })
          .optional()
          .describe('Payload ou ID da mensagem citada'),
        mentionsEveryOne: z
          .boolean()
          .optional()
          .describe('Mencionar todos em um grupo'),
        mentioned: z
          .array(z.string())
          .optional()
          .describe('Array de números para mencionar'),
      }),
      handler: async ({ input }) => {
        try {
          const client = createEvolutionApiClient()
          const payload = {
            number: input.number,
            title: input.title,
            description: input.description,
            buttonText: input.buttonText,
            footerText: input.footerText,
            sections: input.sections,
            delay: input.delay,
            quoted: input.quoted,
            mentionsEveryOne: input.mentionsEveryOne,
            mentioned: input.mentioned,
          }
          const response = await client.post(
            `/message/sendList/${input.instanceName}`,
            payload,
          )
          console.log('[Evolution API] Mensagem de lista enviada')
          return response.data
        } catch (error: any) {
          console.error(
            '[Evolution API] Erro ao enviar mensagem de lista:',
            error.response?.data || error.message,
          )
          throw error
        }
      },
    },

    sendSticker: {
      name: 'sendSticker',
      description: 'Envia uma mensagem de figurinha.',
      schema: z.object({
        instanceName: z.string().describe('Nome da instância do WhatsApp'),
        number: z
          .string()
          .describe(
            'Número do destinatário com Código do País (ex: 559999999999)',
          ),
        sticker: z
          .string()
          .describe('URL ou dados de figurinha codificados em base64'),
        delay: z
          .number()
          .optional()
          .describe('Atraso em milissegundos antes de enviar'),
        quoted: z
          .object({
            key: z.object({ id: z.string() }).optional(),
            message: z.object({ conversation: z.string() }).optional(),
          })
          .optional()
          .describe('Payload ou ID da mensagem citada'),
        mentionsEveryOne: z
          .boolean()
          .optional()
          .describe('Mencionar todos em um grupo'),
        mentioned: z
          .array(z.string())
          .optional()
          .describe('Array de números para mencionar'),
      }),
      handler: async ({ input }) => {
        try {
          const client = createEvolutionApiClient()
          const payload = {
            number: input.number,
            sticker: input.sticker,
            delay: input.delay,
            quoted: input.quoted,
            mentionsEveryOne: input.mentionsEveryOne,
            mentioned: input.mentioned,
          }
          const response = await client.post(
            `/message/sendSticker/${input.instanceName}`,
            payload,
          )
          console.log('[Evolution API] Mensagem de figurinha enviada')
          return response.data
        } catch (error: any) {
          console.error(
            '[Evolution API] Erro ao enviar mensagem de figurinha:',
            error.response?.data || error.message,
          )
          throw error
        }
      },
    },

    // Gerenciamento de Proxy
    setProxy: {
      name: 'setProxy',
      description:
        'Configura as definições de proxy para uma instância do WhatsApp.',
      schema: z.object({
        instanceName: z.string().describe('Nome da instância do WhatsApp'),
        enabled: z.boolean().describe('Habilitar ou desabilitar proxy'),
        host: z.string().describe('Host do proxy'),
        port: z.string().describe('Porta do proxy'),
        protocol: z
          .enum(['http', 'https', 'socks4', 'socks5'])
          .describe('Protocolo do proxy'),
        username: z.string().optional().describe('Nome de usuário do proxy'),
        password: z.string().optional().describe('Senha do proxy'),
      }),
      handler: async ({ input }) => {
        try {
          const client = createEvolutionApiClient()
          const payload = {
            enabled: input.enabled,
            host: input.host,
            port: input.port,
            protocol: input.protocol,
            username: input.username,
            password: input.password,
          }
          const response = await client.post(
            `/proxy/set/${input.instanceName}`,
            payload,
          )
          console.log('[Evolution API] Proxy definido')
          return response.data
        } catch (error: any) {
          console.error(
            '[Evolution API] Erro ao definir proxy:',
            error.response?.data || error.message,
          )
          throw error
        }
      },
    },

    findProxy: {
      name: 'findProxy',
      description:
        'Recupera as configurações atuais de proxy para uma instância do WhatsApp.',
      schema: z.object({
        instanceName: z.string().describe('Nome da instância do WhatsApp'),
      }),
      handler: async ({ input }) => {
        try {
          const client = createEvolutionApiClient()
          const response = await client.get(`/proxy/find/${input.instanceName}`)
          console.log('[Evolution API] Proxy encontrado')
          return response.data
        } catch (error: any) {
          console.error(
            '[Evolution API] Erro ao encontrar proxy:',
            error.response?.data || error.message,
          )
          throw error
        }
      },
    },
  },
})
