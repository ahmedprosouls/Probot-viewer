-- CreateTable
CREATE TABLE "Webhook" (
    "id" TEXT NOT NULL,
    "url" TEXT,
    "method" TEXT NOT NULL,
    "queryParams" JSONB[],
    "headers" JSONB[],
    "body" TEXT,
    "probotId" TEXT NOT NULL,

    CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Webhook" ADD CONSTRAINT "Webhook_probotId_fkey" FOREIGN KEY ("probotId") REFERENCES "Probot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
