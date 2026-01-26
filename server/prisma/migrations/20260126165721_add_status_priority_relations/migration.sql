/*
  Warnings:

  - You are about to drop the column `userId` on the `Priority` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Status` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[projectId,name]` on the table `Priority` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,name]` on the table `Status` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."Priority" DROP CONSTRAINT "Priority_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Status" DROP CONSTRAINT "Status_userId_fkey";

-- DropIndex
DROP INDEX "public"."Priority_userId_idx";

-- DropIndex
DROP INDEX "public"."Priority_userId_name_key";

-- DropIndex
DROP INDEX "public"."Status_userId_idx";

-- DropIndex
DROP INDEX "public"."Status_userId_name_key";

-- AlterTable
ALTER TABLE "Priority" DROP COLUMN "userId",
ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "Status" DROP COLUMN "userId",
ADD COLUMN     "projectId" TEXT;

-- Update existing priorities to assign to first project
UPDATE "Priority" SET "projectId" = (SELECT id FROM "Project" LIMIT 1) WHERE "projectId" IS NULL;

-- Update existing statuses to assign to first project
UPDATE "Status" SET "projectId" = (SELECT id FROM "Project" LIMIT 1) WHERE "projectId" IS NULL;

-- Make projectId NOT NULL
ALTER TABLE "Priority" ALTER COLUMN "projectId" SET NOT NULL;
ALTER TABLE "Status" ALTER COLUMN "projectId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Priority_projectId_idx" ON "Priority"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Priority_projectId_name_key" ON "Priority"("projectId", "name");

-- CreateIndex
CREATE INDEX "Status_projectId_idx" ON "Status"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Status_projectId_name_key" ON "Status"("projectId", "name");

-- AddForeignKey
ALTER TABLE "Status" ADD CONSTRAINT "Status_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Priority" ADD CONSTRAINT "Priority_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
