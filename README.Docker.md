# Docker Setup para SaaS Boilerplate

Este documento fornece instruções para executar o projeto SaaS Boilerplate usando Docker.

## Pré-requisitos

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB+ de RAM disponível
- 10GB+ de espaço em disco

## Estrutura de Arquivos Docker

```
├── Dockerfile                 # Dockerfile principal da aplicação
├── .dockerignore             # Arquivos ignorados no build
├── docker-compose.yml        # Configuração para desenvolvimento
├── docker-compose.prod.yml   # Configuração para produção
├── .env.docker              # Variáveis de ambiente para Docker
└── README.Docker.md         # Este arquivo
```

## Desenvolvimento Local

### 1. Configuração Inicial

```bash
# Clone o repositório (se ainda não fez)
git clone <repository-url>
cd saas-boilerplate

# Copie o arquivo de ambiente
cp .env.docker .env
```

### 2. Executar com Docker Compose

```bash
# Construir e iniciar todos os serviços
docker-compose up --build

# Ou executar em background
docker-compose up -d --build
```

### 3. Configurar o Banco de Dados

```bash
# Executar migrações do Prisma
docker-compose exec app npx prisma migrate deploy

# Gerar o cliente Prisma (se necessário)
docker-compose exec app npx prisma generate

# Opcional: Seed do banco de dados
docker-compose exec app npm run db:seed
```

### 4. Acessar a Aplicação

- **Aplicação Principal**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)
- **MailHog**: http://localhost:8025

## Produção

### 1. Configuração de Produção

```bash
# Copie e configure as variáveis de ambiente
cp .env.docker .env.production

# Edite o arquivo com suas configurações reais
nano .env.production
```

### 2. Deploy em Produção

```bash
# Usar o arquivo de produção
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

## Comandos Úteis

### Gerenciamento de Containers

```bash
# Ver logs da aplicação
docker-compose logs -f app

# Ver logs de todos os serviços
docker-compose logs -f

# Parar todos os serviços
docker-compose down

# Parar e remover volumes (CUIDADO: remove dados)
docker-compose down -v

# Reconstruir apenas a aplicação
docker-compose build app
docker-compose up -d app
```

### Banco de Dados

```bash
# Conectar ao PostgreSQL
docker-compose exec postgres psql -U docker -d docker

# Backup do banco
docker-compose exec postgres pg_dump -U docker docker > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U docker docker < backup.sql

# Executar migrações
docker-compose exec app npx prisma migrate deploy

# Reset do banco (CUIDADO: remove todos os dados)
docker-compose exec app npx prisma migrate reset --force
```

### Desenvolvimento

```bash
# Executar comandos npm dentro do container
docker-compose exec app npm run <script>

# Acessar shell do container
docker-compose exec app sh

# Instalar nova dependência
docker-compose exec app npm install <package>
docker-compose restart app
```

## Troubleshooting

### Problemas Comuns

1. **Erro de conexão com banco de dados**
   ```bash
   # Verificar se o PostgreSQL está rodando
   docker-compose ps postgres
   
   # Ver logs do PostgreSQL
   docker-compose logs postgres
   ```

2. **Aplicação não inicia**
   ```bash
   # Ver logs detalhados
   docker-compose logs app
   
   # Reconstruir a imagem
   docker-compose build --no-cache app
   ```

3. **Problemas de permissão**
   ```bash
   # Limpar volumes e reconstruir
   docker-compose down -v
   docker-compose up --build
   ```

4. **Porta já em uso**
   ```bash
   # Verificar processos usando a porta
   lsof -i :3000
   
   # Ou alterar a porta no docker-compose.yml
   ports:
     - "3001:3000"  # Usar porta 3001 no host
   ```

### Limpeza do Sistema

```bash
# Remover containers parados
docker container prune

# Remover imagens não utilizadas
docker image prune

# Remover volumes não utilizados
docker volume prune

# Limpeza completa (CUIDADO)
docker system prune -a --volumes
```

## Configurações Avançadas

### Variáveis de Ambiente Importantes

| Variável | Descrição | Padrão |
|----------|-----------|---------|
| `DATABASE_URL` | URL de conexão PostgreSQL | `postgresql://docker:docker@postgres:5432/docker` |
| `NEXTAUTH_SECRET` | Chave secreta para autenticação | `your-secret-key-change-this-in-production` |
| `NEXTAUTH_URL` | URL base da aplicação | `http://localhost:3000` |
| `AWS_S3_ENDPOINT` | Endpoint do MinIO/S3 | `http://minio:9000` |
| `SMTP_HOST` | Host do servidor de email | `mailhog` |

### Customização do Dockerfile

O Dockerfile usa multi-stage build para otimização:

1. **deps**: Instala apenas dependências de produção
2. **builder**: Constrói a aplicação
3. **runner**: Imagem final otimizada

### Monitoramento

Para produção, considere adicionar:

- **Logs centralizados**: ELK Stack ou similar
- **Métricas**: Prometheus + Grafana
- **Health checks**: Configurados no docker-compose.prod.yml
- **Backup automatizado**: Scripts de backup do PostgreSQL

## Segurança

### Recomendações para Produção

1. **Altere todas as senhas padrão**
2. **Use HTTPS com certificados SSL**
3. **Configure firewall adequadamente**
4. **Use secrets do Docker Swarm ou Kubernetes**
5. **Mantenha as imagens atualizadas**
6. **Configure logs de auditoria**

### Exemplo de Secrets

```bash
# Criar secrets (Docker Swarm)
echo "your-secret-password" | docker secret create postgres_password -
echo "your-nextauth-secret" | docker secret create nextauth_secret -
```

## Suporte

Para problemas específicos do Docker:

1. Verifique os logs: `docker-compose logs`
2. Consulte a documentação do Docker
3. Abra uma issue no repositório do projeto

Para problemas da aplicação:

1. Consulte o README.md principal
2. Verifique a documentação da API
3. Entre em contato com a equipe de desenvolvimento