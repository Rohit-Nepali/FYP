-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Notification_userId_isArchived_idx" ON "Notification"("userId", "isArchived");
