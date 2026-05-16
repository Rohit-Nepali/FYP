-- AlterTable
ALTER TABLE "UserBehaviorSignal" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "UserBehaviorSignal_deletedAt_idx" ON "UserBehaviorSignal"("deletedAt");
