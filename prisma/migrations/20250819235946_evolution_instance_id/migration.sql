/*
  Warnings:

  - A unique constraint covering the columns `[evolutionInstanceId]` on the table `whatsapp_instance` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."whatsapp_instance" ADD COLUMN     "evolutionInstanceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_instance_evolutionInstanceId_key" ON "public"."whatsapp_instance"("evolutionInstanceId");
