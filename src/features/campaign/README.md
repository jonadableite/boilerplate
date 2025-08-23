# Sistema de Campanhas de Disparo em Massa - WhatsApp

Este sistema permite criar e gerenciar campanhas de disparo em massa no WhatsApp de forma inteligente e segura, evitando bloqueios através de rotação de instâncias, controle de tempo e limpeza de metadados.

## 🚀 Funcionalidades Principais

### 1. **Criação de Campanhas**
- Nome e descrição da campanha
- Mensagem de texto obrigatória
- Upload de mídia opcional (imagem, vídeo, áudio, sticker)
- Configuração de delays entre mensagens
- Seleção de instâncias WhatsApp

### 2. **Sistema Inteligente de Instâncias**
- **Rotação Automática**: Distribui mensagens entre instâncias selecionadas
- **Análise de Saúde**: Considera métricas de saúde da instância
- **Progresso de Aquecimento**: Avalia se a instância está "quente" para uso
- **Balanceamento de Carga**: Evita sobrecarregar uma única instância

### 3. **Controle de Tempo Inteligente**
- **Delay Dinâmico**: Intervalo aleatório entre mensagens (min/max)
- **Configuração Flexível**: De 5 segundos a 600 segundos
- **Evita Padrões**: Tempo variável previne detecção de bot

### 4. **Upload e Processamento de Mídia**
- **Suporte Completo**: Imagens, vídeos, áudios e figurinhas
- **Limpeza de Metadados**: Remove informações sensíveis automaticamente
- **Conversão Base64**: Formato esperado pela Evolution API
- **Validação de Arquivos**: Verifica tipo e tamanho

### 5. **Sistema de Agendamento**
- **Disparo Imediato**: Execução instantânea
- **Agendamento Simples**: Data e hora específica
- **Campanhas Recorrentes**: Diárias, semanais ou mensais
- **Fuso Horário**: Suporte a diferentes regiões

## 🏗️ Arquitetura

```
src/features/campaign/
├── campaign.types.ts              # Tipos TypeScript e schemas Zod
├── controllers/
│   └── campaign.controller.ts     # API endpoints
├── services/
│   ├── message-dispatcher.service.ts      # Disparo principal
│   ├── instance-rotation.service.ts       # Rotação de instâncias
│   ├── metadata-cleaner.service.ts        # Limpeza de metadados
│   └── campaign-scheduler.service.ts      # Agendamento
└── presentation/                  # Componentes React (futuro)
```

## 📊 Modelos de Dados

### Campaign
```typescript
{
  id: string
  name: string
  description?: string
  message: string                    // Obrigatório
  mediaType?: string                // image, video, audio, sticker
  mediaBase64?: string              // Mídia em base64
  mediaCaption?: string             // Legenda da mídia
  minDelay: number                  // Delay mínimo em segundos
  maxDelay: number                  // Delay máximo em segundos
  useInstanceRotation: boolean      // Usar rotação inteligente
  selectedInstances: string[]       // Instâncias selecionadas
  scheduledAt?: Date                // Data/hora agendada
  type: 'IMMEDIATE' | 'SCHEDULED' | 'RECURRING'
  status: CampaignStatus
  progress: number                  // 0-100%
}
```

### CampaignLead
```typescript
{
  id: string
  name?: string
  phone: string                     // Número do telefone
  email?: string
  status: LeadStatus                // PENDING, SENT, DELIVERED, READ, FAILED
  sentAt?: Date
  deliveredAt?: Date
  readAt?: Date
  failedAt?: Date
  failureReason?: string
  messageId?: string                // ID da mensagem no WhatsApp
}
```

## 🔧 Como Usar

### 1. **Criar uma Campanha**

```typescript
// POST /api/campaigns
{
  "name": "Campanha de Boas-vindas",
  "description": "Mensagem para novos clientes",
  "message": "Bem-vindo à nossa empresa!",
  "minDelay": 30,
  "maxDelay": 120,
  "useInstanceRotation": true,
  "selectedInstances": ["instance1", "instance2"],
  "type": "IMMEDIATE"
}
```

### 2. **Upload de Leads**

```typescript
// POST /api/campaigns/{id}/leads
{
  "leads": [
    {
      "name": "João Silva",
      "phone": "11999887766",
      "email": "joao@email.com"
    }
  ]
}
```

### 3. **Iniciar Disparo**

```typescript
// POST /api/campaigns/{id}/start
{
  "message": "Sua mensagem personalizada",
  "media": {
    "type": "image",
    "media": "base64_data",
    "caption": "Legenda da imagem"
  },
  "minDelay": 30,
  "maxDelay": 120
}
```

### 4. **Agendar Campanha**

```typescript
// POST /api/campaigns/{id}/schedule
{
  "scheduledAt": "2024-12-25T10:00:00",
  "timezone": "America/Sao_Paulo",
  "recurring": {
    "enabled": true,
    "frequency": "daily",
    "interval": 1
  }
}
```

## 🧠 Sistema de Rotação Inteligente

### **Score de Prioridade da Instância**

O sistema calcula um score baseado em:

1. **Saúde da Instância (40 pontos)**
   - Métricas de saúde (0-100%)
   - Nível de risco (LOW, MEDIUM, HIGH, CRITICAL)

2. **Progresso de Aquecimento (30 pontos)**
   - Percentual de aquecimento (0-100%)
   - Instâncias com 50%+ são recomendadas

3. **Taxa de Entrega (20 pontos)**
   - Percentual de mensagens entregues
   - Histórico de sucesso

4. **Taxa de Resposta (10 pontos)**
   - Engajamento dos destinatários
   - Qualidade da interação

### **Critérios de Recomendação**

Uma instância é recomendada se:
- ✅ Status: `open` (conectada)
- ✅ Aquecimento: ≥50%
- ✅ Saúde: ≥70%
- ✅ Risco: ≠ `CRITICAL`
- ✅ Mensagens 24h: ≤300
- ✅ Taxa de resposta: ≥60%

## 🛡️ Segurança e Anti-Ban

### **Controles de Tempo**
- **Delay Mínimo**: 5 segundos (evita spam)
- **Delay Máximo**: 600 segundos (comportamento humano)
- **Aleatorização**: Tempo variável entre mensagens

### **Limpeza de Metadados**
- **ExifTool**: Remove metadados de imagens
- **FFmpeg**: Limpa metadados de vídeos/áudios
- **Fallback**: Métodos alternativos se ferramentas não disponíveis

### **Distribuição de Carga**
- **Rotação Inteligente**: Evita sobrecarregar instâncias
- **Limite Diário**: Máximo de 300 mensagens por instância
- **Monitoramento**: Acompanha saúde em tempo real

## 📈 Monitoramento e Estatísticas

### **Métricas da Campanha**
- Total de leads
- Mensagens enviadas
- Taxa de entrega
- Taxa de leitura
- Progresso geral

### **Status dos Leads**
- `PENDING`: Aguardando envio
- `PROCESSING`: Em processamento
- `SENT`: Enviada
- `DELIVERED`: Entregue
- `READ`: Lida
- `FAILED`: Falhou
- `BLOCKED`: Bloqueada

### **Logs e Histórico**
- Histórico completo de execução
- Status de cada mensagem
- Erros e falhas
- Tempo de entrega

## 🚨 Tratamento de Erros

### **Retry Automático**
- Máximo de 3 tentativas por mensagem
- Delay entre tentativas
- Log detalhado de erros

### **Fallback de Instâncias**
- Se uma instância falhar, usa próxima disponível
- Monitoramento de saúde contínuo
- Notificações de problemas

### **Recuperação de Campanhas**
- Pausar/retomar campanhas
- Reset de status de leads
- Continuação de onde parou

## 🔄 Agendamento e Recorrência

### **Tipos de Agendamento**

1. **Imediato**: Execução instantânea
2. **Simples**: Data/hora específica
3. **Recorrente**:
   - **Diário**: A cada X dias
   - **Semanal**: A cada X semanas
   - **Mensal**: A cada X meses

### **Configuração de Recorrência**
```typescript
{
  "enabled": true,
  "frequency": "daily",
  "interval": 1,
  "endDate": "2024-12-31"
}
```

## 📱 Interface do Usuário

### **Páginas Disponíveis**
- `/app/campaigns` - Lista de campanhas
- `/app/campaigns/new` - Criar nova campanha
- `/app/campaigns/[id]` - Detalhes da campanha

### **Componentes Principais**
- Formulário de criação com validação
- Seletor de instâncias com indicadores de saúde
- Upload de mídia com preview
- Configuração de agendamento
- Dashboard de estatísticas em tempo real

## 🚀 Próximos Passos

### **Funcionalidades Planejadas**
- [ ] Templates de mensagens
- [ ] Segmentação de leads
- [ ] A/B testing
- [ ] Relatórios avançados
- [ ] Integração com CRM
- [ ] Webhooks para notificações
- [ ] API para terceiros

### **Melhorias Técnicas**
- [ ] Cache Redis para performance
- [ ] Filas assíncronas (Bull/BullMQ)
- [ ] Métricas em tempo real
- [ ] Alertas automáticos
- [ ] Backup automático de dados

## 📚 Exemplos de Uso

### **Campanha de Marketing**
```typescript
{
  "name": "Black Friday 2024",
  "message": "🔥 Black Friday chegou! Aproveite descontos de até 70%!",
  "media": {
    "type": "image",
    "media": "base64_promo_image",
    "caption": "Ofertas imperdíveis!"
  },
  "minDelay": 60,
  "maxDelay": 300,
  "scheduledAt": "2024-11-29T00:00:00"
}
```

### **Campanha de Nurturing**
```typescript
{
  "name": "Série de Boas-vindas",
  "message": "Olá! Aqui está o primeiro passo para começar...",
  "minDelay": 86400, // 24 horas
  "maxDelay": 86400,
  "recurring": {
    "enabled": true,
    "frequency": "daily",
    "interval": 1,
    "endDate": "2024-12-31"
  }
}
```

## 🆘 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do sistema
2. Consulte a documentação da Evolution API
3. Entre em contato com o suporte técnico

---

**⚠️ Importante**: Este sistema é projetado para uso responsável e em conformidade com as políticas do WhatsApp. Use com moderação e respeite os limites de rate limiting.