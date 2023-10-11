-- AlterTable
ALTER TABLE
  "PublicProbot"
ADD
  COLUMN "version" TEXT;

-- AlterTable
ALTER TABLE
  "Probot"
ADD
  COLUMN "version" TEXT;