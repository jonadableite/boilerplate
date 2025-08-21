-- CreateEnum
CREATE TYPE "public"."ContactStatus" AS ENUM ('LEAD', 'PROSPECT', 'CUSTOMER', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."FunnelStage" AS ENUM ('NEW_LEAD', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATING', 'CLOSED_WON', 'CLOSED_LOST');

-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'STICKER', 'BUTTON_REPLY', 'LIST_REPLY', 'LOCATION');

-- CreateEnum
CREATE TYPE "public"."MessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "public"."MessageStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."ConversationStatus" AS ENUM ('OPEN', 'PENDING', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "public"."contact" (
    "id" TEXT NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "profilePicUrl" TEXT,
    "status" "public"."ContactStatus" NOT NULL DEFAULT 'LEAD',
    "funnelStage" "public"."FunnelStage" NOT NULL DEFAULT 'NEW_LEAD',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "organizationId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."conversation" (
    "id" TEXT NOT NULL,
    "whatsappChatId" TEXT NOT NULL,
    "title" TEXT,
    "status" "public"."ConversationStatus" NOT NULL DEFAULT 'OPEN',
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3),
    "lastMessage" TEXT,
    "lastMessageType" "public"."MessageType",
    "organizationId" TEXT NOT NULL,
    "whatsappInstanceId" TEXT NOT NULL,
    "contactId" TEXT,
    "assignedToId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."message" (
    "id" TEXT NOT NULL,
    "whatsappMessageId" TEXT,
    "content" TEXT NOT NULL,
    "type" "public"."MessageType" NOT NULL DEFAULT 'TEXT',
    "direction" "public"."MessageDirection" NOT NULL,
    "status" "public"."MessageStatus" NOT NULL DEFAULT 'PENDING',
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "quotedMessageId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "fromMe" BOOLEAN NOT NULL DEFAULT false,
    "fromName" TEXT,
    "fromNumber" TEXT,
    "organizationId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "contactId" TEXT,
    "userId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."funnel_stage_history" (
    "id" TEXT NOT NULL,
    "fromStage" "public"."FunnelStage",
    "toStage" "public"."FunnelStage" NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "contactId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "funnel_stage_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contact_whatsappNumber_key" ON "public"."contact"("whatsappNumber");

-- CreateIndex
CREATE INDEX "contact_organizationId_status_idx" ON "public"."contact"("organizationId", "status");

-- CreateIndex
CREATE INDEX "contact_organizationId_funnelStage_idx" ON "public"."contact"("organizationId", "funnelStage");

-- CreateIndex
CREATE INDEX "contact_assignedToId_idx" ON "public"."contact"("assignedToId");

-- CreateIndex
CREATE UNIQUE INDEX "contact_organizationId_whatsappNumber_key" ON "public"."contact"("organizationId", "whatsappNumber");

-- CreateIndex
CREATE INDEX "conversation_organizationId_status_idx" ON "public"."conversation"("organizationId", "status");

-- CreateIndex
CREATE INDEX "conversation_organizationId_lastMessageAt_idx" ON "public"."conversation"("organizationId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "conversation_assignedToId_idx" ON "public"."conversation"("assignedToId");

-- CreateIndex
CREATE INDEX "conversation_whatsappInstanceId_idx" ON "public"."conversation"("whatsappInstanceId");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_organizationId_whatsappChatId_whatsappInstance_key" ON "public"."conversation"("organizationId", "whatsappChatId", "whatsappInstanceId");

-- CreateIndex
CREATE UNIQUE INDEX "message_whatsappMessageId_key" ON "public"."message"("whatsappMessageId");

-- CreateIndex
CREATE INDEX "message_conversationId_timestamp_idx" ON "public"."message"("conversationId", "timestamp");

-- CreateIndex
CREATE INDEX "message_organizationId_direction_status_idx" ON "public"."message"("organizationId", "direction", "status");

-- CreateIndex
CREATE INDEX "message_contactId_idx" ON "public"."message"("contactId");

-- CreateIndex
CREATE INDEX "message_type_idx" ON "public"."message"("type");

-- CreateIndex
CREATE INDEX "funnel_stage_history_contactId_createdAt_idx" ON "public"."funnel_stage_history"("contactId", "createdAt");

-- CreateIndex
CREATE INDEX "funnel_stage_history_organizationId_toStage_idx" ON "public"."funnel_stage_history"("organizationId", "toStage");

-- AddForeignKey
ALTER TABLE "public"."contact" ADD CONSTRAINT "contact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contact" ADD CONSTRAINT "contact_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversation" ADD CONSTRAINT "conversation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversation" ADD CONSTRAINT "conversation_whatsappInstanceId_fkey" FOREIGN KEY ("whatsappInstanceId") REFERENCES "public"."whatsapp_instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversation" ADD CONSTRAINT "conversation_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."conversation" ADD CONSTRAINT "conversation_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message" ADD CONSTRAINT "message_quotedMessageId_fkey" FOREIGN KEY ("quotedMessageId") REFERENCES "public"."message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message" ADD CONSTRAINT "message_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message" ADD CONSTRAINT "message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "public"."conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message" ADD CONSTRAINT "message_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message" ADD CONSTRAINT "message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."funnel_stage_history" ADD CONSTRAINT "funnel_stage_history_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."funnel_stage_history" ADD CONSTRAINT "funnel_stage_history_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."funnel_stage_history" ADD CONSTRAINT "funnel_stage_history_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
