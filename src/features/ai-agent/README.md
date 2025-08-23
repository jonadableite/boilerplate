# AI Agent Feature - WhatsApp com Evolution API

Esta feature implementa um sistema completo de Agentes de IA para WhatsApp usando a Evolution API, com suporte a base de conhecimento, memórias, persona e processamento de áudio.

## 🚀 Funcionalidades

### ✅ Implementado
- **Gestão de Agentes**: Criar, editar e deletar agentes de IA
- **Integração Evolution API**: Conexão completa com WhatsApp via Evolution
- **OpenAI Integration**: Suporte a GPT-4, GPT-3.5 e Assistants
- **Base de Conhecimento**: Sistema de embeddings para documentos
- **Memórias**: Sistema de memória de curto e longo prazo
- **Persona**: Configuração personalizada de comportamento
- **Webhooks**: Recebimento e processamento de mensagens
- **Suporte a Áudio**: STT (Speech-to-Text) e TTS (Text-to-Speech)

### 🔄 Em Desenvolvimento
- Interface de usuário (Next.js)
- Sistema de filas para processamento
- Monitoramento e analytics
- Integração com vector database

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   WhatsApp      │    │  Evolution API   │    │  SaaS Backend   │
│   (Cliente)     │◄──►│  (Baileys)       │◄──►│  (Igniter.js)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                │                        │
                       ┌──────────────────┐    ┌─────────────────┐
                       │   OpenAI API     │    │  Vector DB      │
                       │  (GPT + STT)     │    │  (Embeddings)   │
                       └──────────────────┘    └─────────────────┘
```

## 📁 Estrutura de Arquivos

```
src/features/ai-agent/
├── ai-agent.types.ts          # Tipos TypeScript e schemas Zod
├── controllers/
│   └── ai-agent.controller.ts # Controller Igniter.js
├── services/
│   ├── ai-agent.service.ts    # Serviço principal
│   ├── evolution-api.client.ts # Cliente Evolution API
│   └── knowledge-base.service.ts # Serviço de base de conhecimento
├── webhooks/
│   └── evolution-webhook.handler.ts # Handler de webhooks
├── index.ts                   # Exports
└── README.md                  # Esta documentação
```

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Evolution API
EVOLUTION_API_URL=https://sub.domain.com
EVOLUTION_API_KEY=your_evolution_api_key

# OpenAI
OPENAI_API_KEY=sk-proj-...
```

### Instalação de Dependências

```bash
npm install openai axios
```

## 📖 Uso

### 1. Criar Credenciais OpenAI

```typescript
import { AIAgentController } from '@/features/ai-agent'

// Criar credenciais
const creds = await AIAgentController.createOpenAICreds({
  name: 'Minha API Key',
  apiKey: 'sk-proj-...'
})
```

### 2. Criar um Agente

```typescript
const agent = await AIAgentController.createAgent({
  name: 'Assistente de Vendas',
  description: 'Agente especializado em vendas',
  instanceName: 'minha-instancia',
  openaiCredsId: 'creds_id',
  botType: 'chatCompletion',
  model: 'gpt-4o',
  systemMessages: [
    'Você é um assistente de vendas especializado em produtos SaaS.',
    'Seja sempre prestativo e profissional.'
  ],
  triggerType: 'all',
  triggerOperator: 'none',
  persona: {
    name: 'Alex',
    role: 'Assistente de Vendas',
    tone: 'Profissional e amigável',
    expertise: ['Vendas SaaS', 'Produtos digitais', 'Atendimento ao cliente'],
    limitations: ['Não pode fazer promessas sobre preços', 'Não pode acessar sistemas internos'],
    greeting: 'Olá! Sou o Alex, seu assistente de vendas. Como posso ajudar?',
    fallback: 'Desculpe, não entendi. Pode reformular sua pergunta?'
  }
})
```

### 3. Configurar Base de Conhecimento

```typescript
// Upload de documento
const result = await AIAgentController.uploadKnowledge({
  agentId: agent.id,
  type: 'pdf',
  content: 'Conteúdo do documento...',
  metadata: {
    title: 'Manual do Produto',
    category: 'Documentação'
  }
})
```

### 4. Processar Mensagens

```typescript
// Processar mensagem recebida
const response = await AIAgentController.processMessage({
  agentId: agent.id,
  remoteJid: '5511999999999@s.whatsapp.net',
  message: 'Olá, preciso de ajuda com o produto',
  type: 'text'
})
```

## 🔌 Endpoints da API

### OpenAI Credentials
- `POST /api/v1/ai-agents/openai-creds` - Criar credenciais
- `GET /api/v1/ai-agents/openai-creds` - Listar credenciais
- `DELETE /api/v1/ai-agents/openai-creds/:id` - Deletar credenciais

### AI Agents
- `POST /api/v1/ai-agents/` - Criar agente
- `PUT /api/v1/ai-agents/:id` - Atualizar agente
- `DELETE /api/v1/ai-agents/:id` - Deletar agente

### Sessões
- `POST /api/v1/ai-agents/sessions/status` - Alterar status da sessão
- `GET /api/v1/ai-agents/sessions/:botId` - Buscar sessões

### Configurações
- `POST /api/v1/ai-agents/settings` - Configurar settings padrão
- `GET /api/v1/ai-agents/settings` - Buscar settings padrão

### Processamento
- `POST /api/v1/ai-agents/process-message` - Processar mensagem
- `POST /api/v1/ai-agents/knowledge/upload` - Upload de base de conhecimento

### Utilitários
- `GET /api/v1/ai-agents/test-connection` - Testar conexão

## 🎯 Casos de Uso

### 1. Atendimento ao Cliente
- Agente com base de conhecimento sobre produtos
- Respostas automáticas para perguntas frequentes
- Escalação para humano quando necessário

### 2. Vendas e Qualificação
- Qualificação de leads via WhatsApp
- Apresentação de produtos
- Agendamento de demonstrações

### 3. Suporte Técnico
- Resolução de problemas comuns
- Guias passo-a-passo
- Coleta de informações para tickets

### 4. Treinamento e Onboarding
- Tutoriais interativos
- FAQ dinâmico
- Acompanhamento de progresso

## 🔒 Segurança

- **Autenticação**: Via Igniter.js context
- **Autorização**: Por organização
- **Isolamento**: Dados separados por tenant
- **Criptografia**: API keys em variáveis de ambiente
- **Auditoria**: Logs de todas as operações

## 📊 Monitoramento

### Métricas Importantes
- Taxa de resposta dos agentes
- Tempo de processamento
- Qualidade das respostas
- Uso da base de conhecimento
- Status das sessões

### Logs
- Todas as mensagens processadas
- Erros e exceções
- Performance dos embeddings
- Status da Evolution API

## 🚨 Troubleshooting

### Problemas Comuns

1. **Evolution API não responde**
   - Verificar URL e API key
   - Testar conexão via endpoint `/test-connection`
   - Verificar logs da Evolution API

2. **OpenAI não funciona**
   - Verificar API key
   - Verificar limites de uso
   - Testar com curl direto

3. **Webhooks não chegam**
   - Verificar URL configurada na Evolution
   - Verificar firewall/SSL
   - Testar com webhook de teste

4. **Áudio não é processado**
   - Verificar formato do arquivo
   - Verificar tamanho do arquivo
   - Verificar permissões de STT

## 🔮 Roadmap

### Próximas Versões
- [ ] Interface de usuário completa
- [ ] Sistema de filas com BullMQ
- [ ] Integração com Pinecone/Milvus
- [ ] Analytics avançados
- [ ] Multi-idioma
- [ ] Integração com CRM
- [ ] Chat em tempo real
- [ ] Backup e restore

### Melhorias Técnicas
- [ ] Cache Redis para memórias
- [ ] Rate limiting inteligente
- [ ] Fallback para múltiplos LLMs
- [ ] Compressão de embeddings
- [ ] Otimização de prompts

## 📚 Recursos Adicionais

- [Documentação Evolution API](https://doc.evolution-api.com/v2/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Igniter.js Documentation](https://igniterjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)

## 🤝 Contribuição

Para contribuir com esta feature:

1. Fork o repositório
2. Crie uma branch para sua feature
3. Implemente as mudanças
4. Adicione testes
5. Documente as mudanças
6. Abra um Pull Request

## 📄 Licença

Esta feature está sob a mesma licença do projeto principal.
