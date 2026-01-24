/*
  Warnings:

  - You are about to drop the `Group` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GroupInvite` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GroupMember` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Group" DROP CONSTRAINT "Group_createdById_fkey";

-- DropForeignKey
ALTER TABLE "public"."GroupInvite" DROP CONSTRAINT "GroupInvite_groupId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GroupInvite" DROP CONSTRAINT "GroupInvite_invitedById_fkey";

-- DropForeignKey
ALTER TABLE "public"."GroupMember" DROP CONSTRAINT "GroupMember_groupId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GroupMember" DROP CONSTRAINT "GroupMember_userId_fkey";

-- DropTable
DROP TABLE "public"."Group";

-- DropTable
DROP TABLE "public"."GroupInvite";

-- DropTable
DROP TABLE "public"."GroupMember";
