-- AlterTable
ALTER TABLE "Priority" ALTER COLUMN "projectId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Status" ALTER COLUMN "projectId" DROP NOT NULL;
