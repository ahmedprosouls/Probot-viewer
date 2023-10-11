-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_probotId_fkey";

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_probotId_fkey" FOREIGN KEY ("probotId") REFERENCES "Probot"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
