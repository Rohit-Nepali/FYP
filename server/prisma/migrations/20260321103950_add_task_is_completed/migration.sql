-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false;

-- Backfill completion state from existing status names
UPDATE "Task" t
SET "isCompleted" = true
FROM "Status" s
WHERE t."statusId" = s."id"
	AND (
		LOWER(s."name") LIKE '%done%'
		OR LOWER(s."name") LIKE '%complete%'
		OR LOWER(s."name") LIKE '%finished%'
	);
