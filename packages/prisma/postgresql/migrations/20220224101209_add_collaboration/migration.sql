-- CreateEnum
CREATE TYPE "CollaborationType" AS ENUM ('READ', 'WRITE');

-- CreateTable
CREATE TABLE "Invitation" (
    "email" TEXT NOT NULL,
    "probotId" TEXT NOT NULL,
    "type" "CollaborationType" NOT NULL
);

-- CreateTable
CREATE TABLE "CollaboratorsOnProbots" (
    "userId" TEXT NOT NULL,
    "probotId" TEXT NOT NULL,
    "type" "CollaborationType" NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_email_probotId_key" ON "Invitation"("email", "probotId");

-- CreateIndex
CREATE UNIQUE INDEX "CollaboratorsOnProbots_userId_probotId_key" ON "CollaboratorsOnProbots"("userId", "probotId");

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_probotId_fkey" FOREIGN KEY ("probotId") REFERENCES "Probot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorsOnProbots" ADD CONSTRAINT "CollaboratorsOnProbots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaboratorsOnProbots" ADD CONSTRAINT "CollaboratorsOnProbots_probotId_fkey" FOREIGN KEY ("probotId") REFERENCES "Probot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
