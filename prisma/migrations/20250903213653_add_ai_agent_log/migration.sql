-- AlterTable
ALTER TABLE "public"."organization" ADD COLUMN     "currentDayTokens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currentMonthTokens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastTokenReset" TIMESTAMP(3),
ADD COLUMN     "totalTokensUsed" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."plan" ADD COLUMN     "dailyTokenLimit" INTEGER,
ADD COLUMN     "monthlyTokenLimit" INTEGER;

-- CreateTable
CREATE TABLE "public"."ai_agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'LLM_AGENT',
    "role" TEXT,
    "goal" TEXT,
    "systemPrompt" TEXT NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'gpt-4',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 1000,
    "topP" DOUBLE PRECISION,
    "frequencyPenalty" DOUBLE PRECISION,
    "presencePenalty" DOUBLE PRECISION,
    "knowledgeBaseId" TEXT,
    "enableContentFilter" BOOLEAN NOT NULL DEFAULT true,
    "enablePiiDetection" BOOLEAN NOT NULL DEFAULT true,
    "maxResponseLength" INTEGER,
    "allowedTopics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "blockedTopics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fallbackMessage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "openaiCredsId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."openai_creds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "openai_creds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_agent_memory" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "remoteJid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_agent_memory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."knowledge_chunk" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_chunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_agent_log" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "sessionId" TEXT,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "error" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_agent_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."token_usage_history" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "operation" TEXT NOT NULL,
    "model" TEXT,
    "agentId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_usage_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_agent_organizationId_isActive_idx" ON "public"."ai_agent"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "ai_agent_organizationId_type_idx" ON "public"."ai_agent"("organizationId", "type");

-- CreateIndex
CREATE INDEX "ai_agent_createdById_idx" ON "public"."ai_agent"("createdById");

-- CreateIndex
CREATE INDEX "openai_creds_organizationId_isActive_idx" ON "public"."openai_creds"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "ai_agent_memory_agentId_remoteJid_type_idx" ON "public"."ai_agent_memory"("agentId", "remoteJid", "type");

-- CreateIndex
CREATE INDEX "ai_agent_memory_createdAt_idx" ON "public"."ai_agent_memory"("createdAt");

-- CreateIndex
CREATE INDEX "knowledge_chunk_agentId_sourceId_idx" ON "public"."knowledge_chunk"("agentId", "sourceId");

-- CreateIndex
CREATE INDEX "knowledge_chunk_createdAt_idx" ON "public"."knowledge_chunk"("createdAt");

-- CreateIndex
CREATE INDEX "ai_agent_log_organizationId_agentId_createdAt_idx" ON "public"."ai_agent_log"("organizationId", "agentId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_agent_log_organizationId_level_idx" ON "public"."ai_agent_log"("organizationId", "level");

-- CreateIndex
CREATE INDEX "ai_agent_log_sessionId_idx" ON "public"."ai_agent_log"("sessionId");

-- CreateIndex
CREATE INDEX "token_usage_history_organizationId_createdAt_idx" ON "public"."token_usage_history"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "token_usage_history_organizationId_operation_idx" ON "public"."token_usage_history"("organizationId", "operation");

-- CreateIndex
CREATE INDEX "lead_organizationId_createdAt_idx" ON "public"."lead"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "lead_organizationId_email_idx" ON "public"."lead"("organizationId", "email");

-- CreateIndex
CREATE INDEX "lead_organizationId_name_idx" ON "public"."lead"("organizationId", "name");

-- CreateIndex
CREATE INDEX "lead_organizationId_phone_idx" ON "public"."lead"("organizationId", "phone");

-- CreateIndex
CREATE INDEX "submissions_organizationId_createdAt_idx" ON "public"."submissions"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "submissions_leadId_idx" ON "public"."submissions"("leadId");

-- AddForeignKey
ALTER TABLE "public"."ai_agent" ADD CONSTRAINT "ai_agent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_agent" ADD CONSTRAINT "ai_agent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_agent" ADD CONSTRAINT "ai_agent_openaiCredsId_fkey" FOREIGN KEY ("openaiCredsId") REFERENCES "public"."openai_creds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."openai_creds" ADD CONSTRAINT "openai_creds_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_agent_memory" ADD CONSTRAINT "ai_agent_memory_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."ai_agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."knowledge_chunk" ADD CONSTRAINT "knowledge_chunk_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."ai_agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_agent_log" ADD CONSTRAINT "ai_agent_log_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."token_usage_history" ADD CONSTRAINT "token_usage_history_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
