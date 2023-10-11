DROP INDEX "Answer_resultId_blockId_stepId_key";

ALTER TABLE "Answer" 
RENAME COLUMN "stepId" TO "groupId";

ALTER TABLE "PublicProbot"
RENAME COLUMN "blocks" TO "groups";

ALTER TABLE "PublicProbot"
ALTER COLUMN groups TYPE JSONB USING to_json(groups);

ALTER TABLE "PublicProbot"
ALTER COLUMN edges TYPE JSONB USING to_json(edges);

ALTER TABLE "Probot"
RENAME COLUMN "blocks" TO "groups";

ALTER TABLE "Probot"
ALTER COLUMN groups TYPE JSONB USING to_json(groups);

ALTER TABLE "Probot"
ALTER COLUMN edges TYPE JSONB USING to_json(edges);

UPDATE "Probot" t
SET groups = REPLACE(REPLACE(REPLACE(t.groups::text, '"blockId":', '"groupId":'), '"steps":', '"blocks":'), '"stepId":', '"blockId":')::jsonb,
edges = REPLACE(REPLACE(t.edges::text, '"blockId":', '"groupId":'), '"stepId":', '"blockId":')::jsonb;

UPDATE "PublicProbot" t
SET groups = REPLACE(REPLACE(REPLACE(t.groups::text, '"blockId":', '"groupId":'), '"steps":', '"blocks":'), '"stepId":', '"blockId":')::jsonb,
edges = REPLACE(REPLACE(t.edges::text, '"blockId":', '"groupId":'), '"stepId":', '"blockId":')::jsonb;

-- CreateIndex
CREATE UNIQUE INDEX "Answer_resultId_blockId_groupId_key" ON "Answer"("resultId", "blockId", "groupId");
