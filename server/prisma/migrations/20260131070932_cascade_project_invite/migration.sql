-- DropForeignKey
ALTER TABLE "public"."ProjectInvite" DROP CONSTRAINT "ProjectInvite_projectId_fkey";

-- AddForeignKey
ALTER TABLE "ProjectInvite" ADD CONSTRAINT "ProjectInvite_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
