-- CreateTable
CREATE TABLE "UserBehaviorSignal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT,
    "label" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBehaviorSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserBehaviorSignal_userId_idx" ON "UserBehaviorSignal"("userId");

-- CreateIndex
CREATE INDEX "UserBehaviorSignal_taskId_idx" ON "UserBehaviorSignal"("taskId");

-- CreateIndex
CREATE INDEX "UserBehaviorSignal_createdAt_idx" ON "UserBehaviorSignal"("createdAt");

-- CreateIndex
CREATE INDEX "UserBehaviorSignal_label_idx" ON "UserBehaviorSignal"("label");

-- AddForeignKey
ALTER TABLE "UserBehaviorSignal" ADD CONSTRAINT "UserBehaviorSignal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBehaviorSignal" ADD CONSTRAINT "UserBehaviorSignal_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
