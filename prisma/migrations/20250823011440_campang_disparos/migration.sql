-- CreateEnum
CREATE TYPE "public"."WarmupStatus" AS ENUM ('INACTIVE', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ERROR');

-- CreateEnum
CREATE TYPE "public"."WarmupMessageType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'STICKER', 'REACTION');

-- CreateEnum
CREATE TYPE "public"."HealthRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."HealthAlertType" AS ENUM ('SPAM_REPORTS', 'HIGH_BLOCK_RATE', 'LOW_RESPONSE_RATE', 'MESSAGE_VOLUME', 'DELIVERY_ISSUES', 'POLICY_VIOLATION', 'UNUSUAL_PATTERN', 'ACCOUNT_WARNING', 'ENGAGEMENT_DROP', 'COMPLIANCE_ISSUE');

-- CreateEnum
CREATE TYPE "public"."HealthAlertSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."HealthPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED', 'ERROR');

-- CreateEnum
CREATE TYPE "public"."CampaignType" AS ENUM ('IMMEDIATE', 'SCHEDULED', 'RECURRING');

-- CreateEnum
CREATE TYPE "public"."LeadStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'BLOCKED');

-- CreateTable
CREATE TABLE "public"."warmup_stats" (
    "id" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    "status" "public"."WarmupStatus" NOT NULL DEFAULT 'INACTIVE',
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pauseTime" TIMESTAMP(3),
    "warmupTime" INTEGER DEFAULT 0,
    "progress" DOUBLE PRECISION DEFAULT 0.0,
    "lastActive" TIMESTAMP(3),
    "targetDuration" INTEGER DEFAULT 2073600,
    "config" JSONB,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mediaStatsId" TEXT NOT NULL,
    "mediaReceivedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warmup_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."media_stats" (
    "id" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    "text" INTEGER NOT NULL DEFAULT 0,
    "image" INTEGER NOT NULL DEFAULT 0,
    "video" INTEGER NOT NULL DEFAULT 0,
    "audio" INTEGER NOT NULL DEFAULT 0,
    "sticker" INTEGER NOT NULL DEFAULT 0,
    "reaction" INTEGER NOT NULL DEFAULT 0,
    "totalDaily" INTEGER NOT NULL DEFAULT 0,
    "totalAllTime" INTEGER NOT NULL DEFAULT 0,
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "totalReceived" INTEGER NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."media_received" (
    "id" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    "text" INTEGER NOT NULL DEFAULT 0,
    "image" INTEGER NOT NULL DEFAULT 0,
    "video" INTEGER NOT NULL DEFAULT 0,
    "audio" INTEGER NOT NULL DEFAULT 0,
    "sticker" INTEGER NOT NULL DEFAULT 0,
    "reaction" INTEGER NOT NULL DEFAULT 0,
    "totalDaily" INTEGER NOT NULL DEFAULT 0,
    "totalAllTime" INTEGER NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_received_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."warmup_content" (
    "id" TEXT NOT NULL,
    "type" "public"."WarmupMessageType" NOT NULL,
    "content" TEXT,
    "caption" TEXT,
    "fileName" TEXT,
    "mimeType" TEXT,
    "metadata" JSONB,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warmup_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."warmup_external_number" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "name" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warmup_external_number_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."health_benchmarks" (
    "id" TEXT NOT NULL,
    "optimalResponseRate" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    "maxDailyMessages" INTEGER NOT NULL DEFAULT 1000,
    "maxMessagesPerHour" INTEGER NOT NULL DEFAULT 100,
    "minResponseTime" INTEGER NOT NULL DEFAULT 300,
    "maxResponseTime" INTEGER NOT NULL DEFAULT 3600,
    "criticalSpamReports" INTEGER NOT NULL DEFAULT 5,
    "criticalBlockRate" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "minDeliveryRate" DOUBLE PRECISION NOT NULL DEFAULT 0.95,
    "maxInactivityHours" INTEGER NOT NULL DEFAULT 72,
    "safeMessagingHours" JSONB NOT NULL DEFAULT '[9,10,11,12,13,14,15,16,17,18]',
    "safeDaysOfWeek" JSONB NOT NULL DEFAULT '[1,2,3,4,5]',
    "optimalMessageGap" INTEGER NOT NULL DEFAULT 30,
    "maxBulkSize" INTEGER NOT NULL DEFAULT 50,
    "humanBehaviorScore" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_benchmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."health_metrics" (
    "id" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "messagesSent24h" INTEGER NOT NULL DEFAULT 0,
    "messagesReceived24h" INTEGER NOT NULL DEFAULT 0,
    "responseRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "averageResponseTime" INTEGER NOT NULL DEFAULT 0,
    "deliveryRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "readRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "spamReports" INTEGER NOT NULL DEFAULT 0,
    "blockRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "policyViolations" INTEGER NOT NULL DEFAULT 0,
    "warningsReceived" INTEGER NOT NULL DEFAULT 0,
    "accountRestrictions" INTEGER NOT NULL DEFAULT 0,
    "messagingFrequency" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "peakHours" JSONB NOT NULL DEFAULT '[]',
    "messagePatterns" JSONB NOT NULL DEFAULT '{}',
    "humanBehaviorScore" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "clickThroughRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "userEngagementScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "healthScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "riskLevel" "public"."HealthRiskLevel" NOT NULL DEFAULT 'LOW',
    "riskFactors" JSONB NOT NULL DEFAULT '[]',
    "benchmarkCompliance" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "deviationScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "dataQuality" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "confidenceLevel" DOUBLE PRECISION NOT NULL DEFAULT 0.95,
    "samplingPeriod" INTEGER NOT NULL DEFAULT 24,
    "analyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextAnalysisAt" TIMESTAMP(3),

    CONSTRAINT "health_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."health_alerts" (
    "id" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "alertType" "public"."HealthAlertType" NOT NULL,
    "severity" "public"."HealthAlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "actionRequired" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "threshold" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "trendDirection" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."health_recommendations" (
    "id" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "recommendationType" TEXT NOT NULL,
    "priority" "public"."HealthPriority" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "actions" JSONB NOT NULL DEFAULT '[]',
    "expectedImpact" TEXT,
    "difficulty" TEXT,
    "estimatedTime" TEXT,
    "isImplemented" BOOLEAN NOT NULL DEFAULT false,
    "implementedAt" TIMESTAMP(3),
    "effectiveness" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."account_health_history" (
    "id" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "healthScore" DOUBLE PRECISION NOT NULL,
    "riskLevel" "public"."HealthRiskLevel" NOT NULL,
    "mainMetrics" JSONB NOT NULL,
    "keyChanges" JSONB NOT NULL DEFAULT '[]',
    "scoreChange" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "trendAnalysis" JSONB NOT NULL DEFAULT '{}',
    "seasonality" JSONB NOT NULL DEFAULT '{}',
    "eventsDetected" JSONB NOT NULL DEFAULT '[]',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_health_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "message" TEXT NOT NULL,
    "mediaType" TEXT,
    "mediaUrl" TEXT,
    "mediaCaption" TEXT,
    "mediaBase64" TEXT,
    "minDelay" INTEGER NOT NULL DEFAULT 30,
    "maxDelay" INTEGER NOT NULL DEFAULT 120,
    "useInstanceRotation" BOOLEAN NOT NULL DEFAULT true,
    "selectedInstances" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scheduledAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "recurring" JSONB,
    "status" "public"."CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "type" "public"."CampaignType" NOT NULL DEFAULT 'IMMEDIATE',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalLeads" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."campaign_lead" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "status" "public"."LeadStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "messageId" TEXT,
    "campaignId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."campaign_statistics" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "totalLeads" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "blockedCount" INTEGER NOT NULL DEFAULT 0,
    "averageDeliveryTime" DOUBLE PRECISION,
    "averageReadTime" DOUBLE PRECISION,
    "deliveryRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "readRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."message_log" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "campaignLeadId" TEXT,
    "messageType" TEXT NOT NULL,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "statusHistory" JSONB NOT NULL DEFAULT '[]',
    "messageDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "warmup_stats_instanceName_key" ON "public"."warmup_stats"("instanceName");

-- CreateIndex
CREATE UNIQUE INDEX "warmup_stats_mediaStatsId_key" ON "public"."warmup_stats"("mediaStatsId");

-- CreateIndex
CREATE UNIQUE INDEX "warmup_stats_mediaReceivedId_key" ON "public"."warmup_stats"("mediaReceivedId");

-- CreateIndex
CREATE INDEX "warmup_stats_organizationId_status_idx" ON "public"."warmup_stats"("organizationId", "status");

-- CreateIndex
CREATE INDEX "warmup_stats_userId_status_idx" ON "public"."warmup_stats"("userId", "status");

-- CreateIndex
CREATE INDEX "warmup_stats_instanceName_status_idx" ON "public"."warmup_stats"("instanceName", "status");

-- CreateIndex
CREATE INDEX "media_stats_organizationId_instanceName_idx" ON "public"."media_stats"("organizationId", "instanceName");

-- CreateIndex
CREATE INDEX "media_stats_date_idx" ON "public"."media_stats"("date");

-- CreateIndex
CREATE UNIQUE INDEX "media_stats_instanceName_date_organizationId_key" ON "public"."media_stats"("instanceName", "date", "organizationId");

-- CreateIndex
CREATE INDEX "media_received_organizationId_instanceName_idx" ON "public"."media_received"("organizationId", "instanceName");

-- CreateIndex
CREATE INDEX "media_received_date_idx" ON "public"."media_received"("date");

-- CreateIndex
CREATE UNIQUE INDEX "media_received_instanceName_date_organizationId_key" ON "public"."media_received"("instanceName", "date", "organizationId");

-- CreateIndex
CREATE INDEX "warmup_content_organizationId_type_idx" ON "public"."warmup_content"("organizationId", "type");

-- CreateIndex
CREATE INDEX "warmup_content_userId_type_idx" ON "public"."warmup_content"("userId", "type");

-- CreateIndex
CREATE INDEX "warmup_external_number_organizationId_active_idx" ON "public"."warmup_external_number"("organizationId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "warmup_external_number_organizationId_phoneNumber_key" ON "public"."warmup_external_number"("organizationId", "phoneNumber");

-- CreateIndex
CREATE INDEX "health_metrics_organizationId_riskLevel_idx" ON "public"."health_metrics"("organizationId", "riskLevel");

-- CreateIndex
CREATE INDEX "health_metrics_instanceName_analyzedAt_idx" ON "public"."health_metrics"("instanceName", "analyzedAt");

-- CreateIndex
CREATE UNIQUE INDEX "health_metrics_instanceName_organizationId_analyzedAt_key" ON "public"."health_metrics"("instanceName", "organizationId", "analyzedAt");

-- CreateIndex
CREATE INDEX "health_alerts_organizationId_isActive_idx" ON "public"."health_alerts"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "health_alerts_instanceName_severity_idx" ON "public"."health_alerts"("instanceName", "severity");

-- CreateIndex
CREATE INDEX "health_recommendations_organizationId_priority_idx" ON "public"."health_recommendations"("organizationId", "priority");

-- CreateIndex
CREATE INDEX "health_recommendations_instanceName_isImplemented_idx" ON "public"."health_recommendations"("instanceName", "isImplemented");

-- CreateIndex
CREATE INDEX "account_health_history_organizationId_recordedAt_idx" ON "public"."account_health_history"("organizationId", "recordedAt");

-- CreateIndex
CREATE INDEX "account_health_history_instanceName_healthScore_idx" ON "public"."account_health_history"("instanceName", "healthScore");

-- CreateIndex
CREATE INDEX "campaign_organizationId_status_idx" ON "public"."campaign"("organizationId", "status");

-- CreateIndex
CREATE INDEX "campaign_organizationId_type_idx" ON "public"."campaign"("organizationId", "type");

-- CreateIndex
CREATE INDEX "campaign_scheduledAt_idx" ON "public"."campaign"("scheduledAt");

-- CreateIndex
CREATE INDEX "campaign_lead_campaignId_status_idx" ON "public"."campaign_lead"("campaignId", "status");

-- CreateIndex
CREATE INDEX "campaign_lead_phone_idx" ON "public"."campaign_lead"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_statistics_campaignId_key" ON "public"."campaign_statistics"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "message_log_messageId_key" ON "public"."message_log"("messageId");

-- CreateIndex
CREATE INDEX "message_log_campaignId_status_idx" ON "public"."message_log"("campaignId", "status");

-- CreateIndex
CREATE INDEX "message_log_messageDate_idx" ON "public"."message_log"("messageDate");

-- AddForeignKey
ALTER TABLE "public"."warmup_stats" ADD CONSTRAINT "warmup_stats_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warmup_stats" ADD CONSTRAINT "warmup_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warmup_stats" ADD CONSTRAINT "warmup_stats_mediaStatsId_fkey" FOREIGN KEY ("mediaStatsId") REFERENCES "public"."media_stats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warmup_stats" ADD CONSTRAINT "warmup_stats_mediaReceivedId_fkey" FOREIGN KEY ("mediaReceivedId") REFERENCES "public"."media_received"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."media_stats" ADD CONSTRAINT "media_stats_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."media_received" ADD CONSTRAINT "media_received_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warmup_content" ADD CONSTRAINT "warmup_content_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warmup_content" ADD CONSTRAINT "warmup_content_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warmup_external_number" ADD CONSTRAINT "warmup_external_number_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_metrics" ADD CONSTRAINT "health_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_alerts" ADD CONSTRAINT "health_alerts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_recommendations" ADD CONSTRAINT "health_recommendations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."account_health_history" ADD CONSTRAINT "account_health_history_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaign" ADD CONSTRAINT "campaign_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaign" ADD CONSTRAINT "campaign_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaign_lead" ADD CONSTRAINT "campaign_lead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaign_statistics" ADD CONSTRAINT "campaign_statistics_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."message_log" ADD CONSTRAINT "message_log_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
