-- DropIndex
DROP INDEX IF EXISTS "Answer_groupId_idx";

-- DropIndex
DROP INDEX IF EXISTS "Result_probotId_idx";

-- AlterTable
ALTER TABLE
  "Answer"
ADD
  COLUMN "itemId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Answer_blockId_itemId_idx" ON "Answer"("blockId", "itemId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Answer_storageUsed_idx" ON "Answer"("storageUsed");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Result_probotId_hasStarted_createdAt_idx" ON "Result"("probotId", "hasStarted", "createdAt" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Result_probotId_isCompleted_idx" ON "Result"("probotId", "isCompleted");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Probot_isArchived_createdAt_idx" ON "Probot"("isArchived", "createdAt" DESC);