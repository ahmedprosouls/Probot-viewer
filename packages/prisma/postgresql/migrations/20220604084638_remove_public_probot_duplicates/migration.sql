-- DropIndex
DROP INDEX "PublicProbot_customDomain_key";

-- DropIndex
DROP INDEX "PublicProbot_publicId_key";

-- AlterTable
ALTER TABLE "PublicProbot" DROP COLUMN "customDomain",
DROP COLUMN "name",
DROP COLUMN "publicId";
