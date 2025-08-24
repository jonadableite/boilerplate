-- CreateTable
CREATE TABLE "public"."ai_agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "instanceName" TEXT NOT NULL,
    "evolutionBotId" TEXT,
    "openaiCredsId" TEXT NOT NULL,
    "botType" TEXT NOT NULL,
    "assistantId" TEXT,
    "functionUrl" TEXT,
    "model" TEXT,
    "systemMessages" JSONB,
    "assistantMessages" JSONB,
    "userMessages" JSONB,
    "maxTokens" INTEGER,
    "triggerType" TEXT NOT NULL,
    "triggerOperator" TEXT NOT NULL,
    "triggerValue" TEXT,
    "expire" INTEGER,
    "keywordFinish" TEXT,
    "delayMessage" INTEGER,
    "unknownMessage" TEXT,
    "listeningFromMe" BOOLEAN,
    "stopBotFromMe" BOOLEAN,
    "keepOpen" BOOLEAN,
    "debounceTime" INTEGER,
    "ignoreJids" JSONB,
    "persona" JSONB,
    "knowledgeBase" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."openai_creds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "openai_creds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_agent_session" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "openaiBotId" TEXT NOT NULL,
    "remoteJid" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_agent_session_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE UNIQUE INDEX "ai_agent_evolutionBotId_key" ON "public"."ai_agent"("evolutionBotId");

-- CreateIndex
CREATE INDEX "ai_agent_organizationId_status_idx" ON "public"."ai_agent"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ai_agent_instanceName_idx" ON "public"."ai_agent"("instanceName");

-- CreateIndex
CREATE UNIQUE INDEX "openai_creds_organizationId_name_key" ON "public"."openai_creds"("organizationId", "name");

-- CreateIndex
CREATE INDEX "ai_agent_session_agentId_remoteJid_idx" ON "public"."ai_agent_session"("agentId", "remoteJid");

-- CreateIndex
CREATE INDEX "ai_agent_session_status_idx" ON "public"."ai_agent_session"("status");

-- CreateIndex
CREATE INDEX "ai_agent_memory_agentId_remoteJid_type_idx" ON "public"."ai_agent_memory"("agentId", "remoteJid", "type");

-- CreateIndex
CREATE INDEX "ai_agent_memory_createdAt_idx" ON "public"."ai_agent_memory"("createdAt");

-- CreateIndex
CREATE INDEX "knowledge_chunk_agentId_sourceId_idx" ON "public"."knowledge_chunk"("agentId", "sourceId");

-- CreateIndex
CREATE INDEX "knowledge_chunk_createdAt_idx" ON "public"."knowledge_chunk"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."ai_agent" ADD CONSTRAINT "ai_agent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_agent" ADD CONSTRAINT "ai_agent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."openai_creds" ADD CONSTRAINT "openai_creds_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_agent_session" ADD CONSTRAINT "ai_agent_session_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."ai_agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_agent_memory" ADD CONSTRAINT "ai_agent_memory_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."ai_agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."knowledge_chunk" ADD CONSTRAINT "knowledge_chunk_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "public"."ai_agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
