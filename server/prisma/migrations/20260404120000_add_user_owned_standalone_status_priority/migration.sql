-- AlterTable
ALTER TABLE "Priority" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Status" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "Priority_userId_idx" ON "Priority"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Priority_userId_name_key" ON "Priority"("userId", "name");

-- CreateIndex
CREATE INDEX "Status_userId_idx" ON "Status"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Status_userId_name_key" ON "Status"("userId", "name");

-- AddForeignKey
ALTER TABLE "Priority" ADD CONSTRAINT "Priority_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Status" ADD CONSTRAINT "Status_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
