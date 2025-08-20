-- CreateEnum
CREATE TYPE "public"."InstanceConnectionStatus" AS ENUM ('open', 'close', 'connecting');

-- CreateTable
CREATE TABLE "public"."whatsapp_instance" (
    "id" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    "status" "public"."InstanceConnectionStatus" NOT NULL DEFAULT 'connecting',
    "ownerJid" TEXT,
    "profileName" TEXT,
    "profilePicUrl" TEXT,
    "lastSeen" TIMESTAMP(3),
    "metadata" JSONB,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_instance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_instance_instanceName_key" ON "public"."whatsapp_instance"("instanceName");

-- CreateIndex
CREATE INDEX "whatsapp_instance_organizationId_userId_idx" ON "public"."whatsapp_instance"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "whatsapp_instance_status_idx" ON "public"."whatsapp_instance"("status");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_instance_organizationId_instanceName_key" ON "public"."whatsapp_instance"("organizationId", "instanceName");

-- AddForeignKey
ALTER TABLE "public"."whatsapp_instance" ADD CONSTRAINT "whatsapp_instance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."whatsapp_instance" ADD CONSTRAINT "whatsapp_instance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."whatsapp_instance" ADD CONSTRAINT "whatsapp_instance_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
