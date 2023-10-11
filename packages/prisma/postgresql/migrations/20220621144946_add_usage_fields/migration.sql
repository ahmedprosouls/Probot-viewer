/*
  Warnings:

  - Made the column `groups` on table `PublicProbot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `edges` on table `PublicProbot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `groups` on table `Probot` required. This step will fail if there are existing NULL values in that column.
  - Made the column `edges` on table `Probot` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "storageUsed" INTEGER;

-- AlterTable
ALTER TABLE "PublicProbot" ALTER COLUMN "groups" SET NOT NULL,
ALTER COLUMN "edges" SET NOT NULL;

-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "hasStarted" BOOLEAN;

-- AlterTable
ALTER TABLE "Probot" ALTER COLUMN "groups" SET NOT NULL,
ALTER COLUMN "edges" SET NOT NULL;
