# Sistema de Agentes IA para WhatsApp

Este sistema permite criar e gerenciar agentes de IA inteligentes que podem conversar automaticamente com clientes via WhatsApp, integrando com a OpenAI e Evolution API.

## 🚀 Funcionalidades

- **Criação de Agentes**: Configure agentes com personas personalizadas
- **Integração OpenAI**: Suporte a GPT-4o, GPT-4o-mini e GPT-3.5-turbo
- **Base de Conhecimento**: Carregue documentos para respostas contextualizadas
- **Gestão de Memória**: Sistema de memória de curto e longo prazo
- **Integração WhatsApp**: Via Evolution API
- **Interface Web**: Dashboard completo para gerenciamento

## 📋 Pré-requisitos

1. **OpenAI API Key**: Obtenha em [platform.openai.com](https://platform.openai.com)
2. **Evolution API**: Instância configurada para WhatsApp
3. **Banco de Dados**: PostgreSQL com Prisma configurado
4. **Node.js**: Versão 18+ recomendada

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```bash
# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key-here

# Evolution API
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your-evolution-api-key

# Banco de Dados
DATABASE_URL="postgresql://user:password@localhost:5432/database"
```

### 2. Instalação de Dependências

```bash
npm install openai @openai/agents zod
```

### 3. Configuração do Banco

Execute as migrações do Prisma:

```bash
npx prisma migrate dev
npx prisma generate
```

## 🏗️ Arquitetura

```
src/features/ai-agent/
├── controllers/           # Controllers da API
├── services/             # Lógica de negócio
│   ├── ai-agent.service.ts      # Serviço principal
│   ├── openai.service.ts        # Integração OpenAI
│   ├── evolution-api.client.ts  # Cliente Evolution API
│   └── knowledge-base.service.ts # Base de conhecimento
├── presentation/         # Interface React
│   ├── components/       # Componentes UI
│   └── hooks/           # Hooks React
├── config/              # Configurações
└── ai-agent.types.ts    # Tipos TypeScript
```

## 🔧 Uso

### 1. Criar um Agente

```typescript
import { useAIAgents } from '@/features/ai-agent/presentation/hooks/use-ai-agents'

const { createAgent } = useAIAgents()

const newAgent = await createAgent({
  name: 'Alex - Assistente de Vendas',
  description: 'Agente especializado em vendas',
  instanceName: 'vendas-instance',
  openaiCredsId: 'default',
  botType: 'chatCompletion',
  model: 'gpt-4o',
  persona: {
    name: 'Alex',
    role: 'Assistente de Vendas',
    tone: 'Profissional e amigável',
    expertise: ['Vendas', 'Produtos'],
    limitations: ['Não pode fazer promessas'],
    greeting: 'Olá! Como posso ajudar?',
    fallback: 'Desculpe, não entendi. Pode reformular?'
  }
})
```

### 2. Processar Mensagem

```typescript
import { AIAgentService } from '@/features/ai-agent/services/ai-agent.service'

const service = new AIAgentService(
  evolutionBaseURL,
  evolutionApiKey,
  instanceName,
  openaiApiKey
)

const response = await service.processMessage(agentId, {
  remoteJid: '5511999999999@s.whatsapp.net',
  message: 'Olá, preciso de ajuda com vendas',
  type: 'text'
})
```

### 3. Gerenciar Base de Conhecimento

```typescript
import { KnowledgeBaseService } from '@/features/ai-agent/services/knowledge-base.service'

const kbService = new KnowledgeBaseService(openaiApiKey)

// Processar documento
const chunks = await kbService.processDocument(
  'Conteúdo do documento...',
  { agentId: 'agent_123', sourceId: 'doc_456' }
)

// Buscar chunks relevantes
const relevantChunks = await kbService.searchSimilarChunks(
  'Pergunta do usuário',
  chunks,
  5
)
```

## 🎯 Tipos de Agentes

### 1. Chat Completion
- Usa modelos GPT diretamente
- Mais flexível para personalização
- Melhor para respostas rápidas

### 2. OpenAI Assistant
- Usa a API de Assistants da OpenAI
- Suporte a threads de conversa
- Melhor para conversas longas

## 🔐 Segurança

- API Keys são armazenadas de forma segura
- Isolamento por organização
- Validação de entrada com Zod
- Rate limiting configurável

## 📊 Monitoramento

- Logs detalhados de todas as operações
- Métricas de uso e performance
- Rastreamento de erros
- Dashboard de status

## 🚨 Troubleshooting

### Erro: "Configurações da Evolution API não encontradas"
- Verifique se `EVOLUTION_API_URL` e `EVOLUTION_API_KEY` estão configurados
- Confirme se a Evolution API está rodando

### Erro: "API Key da OpenAI inválida"
- Verifique se `OPENAI_API_KEY` está correto
- Confirme se a chave tem créditos disponíveis

### Erro: "Falha ao criar bot na Evolution API"
- Verifique se a Evolution API está acessível
- Confirme se as credenciais estão corretas
- Verifique os logs da Evolution API

## 🔄 Atualizações

### Migração de Versões
1. Execute `npx prisma migrate dev`
2. Atualize as dependências: `npm update`
3. Verifique a compatibilidade das APIs

### Backup de Dados
- Faça backup do banco antes de atualizações
- Exporte configurações de agentes importantes
- Teste em ambiente de desenvolvimento

## 📚 Recursos Adicionais

- [Documentação OpenAI](https://platform.openai.com/docs)
- [Evolution API Docs](https://doc.evolution-api.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para detalhes.

## 🆘 Suporte

Para suporte técnico:
- Abra uma issue no GitHub
- Consulte a documentação
- Entre em contato com a equipe de desenvolvimento

---

**Nota**: Este sistema está em desenvolvimento ativo. Funcionalidades podem ser adicionadas ou modificadas.
