-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_probotId_fkey";

-- AlterTable
ALTER TABLE "Result" ALTER COLUMN "isArchived" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Probot" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_probotId_fkey" FOREIGN KEY ("probotId") REFERENCES "Probot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
