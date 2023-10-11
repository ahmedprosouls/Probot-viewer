/*
  Warnings:

  - A unique constraint covering the columns `[customDomain]` on the table `PublicProbot` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[customDomain]` on the table `Probot` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PublicProbot" ADD COLUMN     "customDomain" TEXT;

-- AlterTable
ALTER TABLE "Probot" ADD COLUMN     "customDomain" TEXT;

-- CreateTable
CREATE TABLE "CustomDomain" (
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomDomain_name_key" ON "CustomDomain"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PublicProbot_customDomain_key" ON "PublicProbot"("customDomain");

-- CreateIndex
CREATE UNIQUE INDEX "Probot_customDomain_key" ON "Probot"("customDomain");

-- AddForeignKey
ALTER TABLE "CustomDomain" ADD CONSTRAINT "CustomDomain_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
