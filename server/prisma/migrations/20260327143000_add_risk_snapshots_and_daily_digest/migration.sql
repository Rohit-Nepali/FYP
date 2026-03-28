-- AlterTable
ALTER TABLE "User"
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC',
ADD COLUMN     "dailyDigestEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "digestHourLocal" INTEGER NOT NULL DEFAULT 19;

-- AlterTable
ALTER TABLE "Notification"
ADD COLUMN     "ignoredAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TaskRiskSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "risk" TEXT NOT NULL,
    "probability" DOUBLE PRECISION NOT NULL,
    "topFactors" JSONB,
    "source" TEXT NOT NULL DEFAULT 'on_demand',
    "predictedForDateKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskRiskSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyDigestLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "digestDateKey" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "deliveryChannel" TEXT NOT NULL DEFAULT 'in_app',
    "payloadHash" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyDigestLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskRiskSnapshot_userId_taskId_predictedForDateKey_key" ON "TaskRiskSnapshot"("userId", "taskId", "predictedForDateKey");

-- CreateIndex
CREATE INDEX "TaskRiskSnapshot_userId_predictedForDateKey_idx" ON "TaskRiskSnapshot"("userId", "predictedForDateKey");

-- CreateIndex
CREATE INDEX "TaskRiskSnapshot_taskId_createdAt_idx" ON "TaskRiskSnapshot"("taskId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DailyDigestLog_userId_digestDateKey_key" ON "DailyDigestLog"("userId", "digestDateKey");

-- CreateIndex
CREATE INDEX "DailyDigestLog_digestDateKey_idx" ON "DailyDigestLog"("digestDateKey");

-- AddForeignKey
ALTER TABLE "TaskRiskSnapshot" ADD CONSTRAINT "TaskRiskSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskRiskSnapshot" ADD CONSTRAINT "TaskRiskSnapshot_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyDigestLog" ADD CONSTRAINT "DailyDigestLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
