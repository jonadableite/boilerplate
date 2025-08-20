/*
  Warnings:

  - You are about to drop the column `category` on the `integration` table. All the data in the column will be lost.
  - You are about to drop the column `comingSoon` on the `integration` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `integration` table. All the data in the column will be lost.
  - You are about to drop the column `developer` on the `integration` table. All the data in the column will be lost.
  - You are about to drop the column `guideUrl` on the `integration` table. All the data in the column will be lost.
  - You are about to drop the column `installUrl` on the `integration` table. All the data in the column will be lost.
  - You are about to drop the column `logo` on the `integration` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `integration` table. All the data in the column will be lost.
  - You are about to drop the column `readme` on the `integration` table. All the data in the column will be lost.
  - You are about to drop the column `screenshots` on the `integration` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `integration` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `integration` table. All the data in the column will be lost.
  - You are about to drop the column `verified` on the `integration` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `integration` table. All the data in the column will be lost.
  - You are about to drop the `installed_integration` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[provider,organizationId]` on the table `integration` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `provider` to the `integration` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "installed_integration" DROP CONSTRAINT "installed_integration_integrationId_fkey";

-- DropForeignKey
ALTER TABLE "installed_integration" DROP CONSTRAINT "installed_integration_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "installed_integration" DROP CONSTRAINT "installed_integration_userId_fkey";

-- DropForeignKey
ALTER TABLE "installed_integration" DROP CONSTRAINT "installed_integration_webhookId_fkey";

-- DropForeignKey
ALTER TABLE "integration" DROP CONSTRAINT "integration_userId_fkey";

-- DropIndex
DROP INDEX "integration_slug_key";

-- DropIndex
DROP INDEX "integration_userId_idx";

-- AlterTable
ALTER TABLE "integration" DROP COLUMN "category",
DROP COLUMN "comingSoon",
DROP COLUMN "description",
DROP COLUMN "developer",
DROP COLUMN "guideUrl",
DROP COLUMN "installUrl",
DROP COLUMN "logo",
DROP COLUMN "name",
DROP COLUMN "readme",
DROP COLUMN "screenshots",
DROP COLUMN "slug",
DROP COLUMN "userId",
DROP COLUMN "verified",
DROP COLUMN "website",
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "provider" TEXT NOT NULL,
ADD COLUMN     "webhookId" TEXT;

-- DropTable
DROP TABLE "installed_integration";

-- CreateIndex
CREATE INDEX "integration_webhookId_idx" ON "integration"("webhookId");

-- CreateIndex
CREATE UNIQUE INDEX "integration_provider_organizationId_key" ON "integration"("provider", "organizationId");

-- AddForeignKey
ALTER TABLE "integration" ADD CONSTRAINT "integration_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "webhook"("id") ON DELETE SET NULL ON UPDATE CASCADE;
