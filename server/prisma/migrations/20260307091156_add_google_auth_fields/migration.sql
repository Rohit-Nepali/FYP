-- AlterTable
ALTER TABLE "User" ADD COLUMN     "calendarConnected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "googleRefreshToken" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "TaskCalendarLink" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "calendarEventId" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncDirection" TEXT NOT NULL DEFAULT 'both',

    CONSTRAINT "TaskCalendarLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskCalendarLink_taskId_key" ON "TaskCalendarLink"("taskId");

-- CreateIndex
CREATE INDEX "TaskCalendarLink_taskId_idx" ON "TaskCalendarLink"("taskId");
