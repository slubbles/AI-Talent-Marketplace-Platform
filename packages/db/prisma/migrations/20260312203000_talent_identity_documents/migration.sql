ALTER TABLE "TalentProfile"
ADD COLUMN "identityDocumentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

UPDATE "TalentProfile"
SET "identityDocumentUrls" = ARRAY[]::TEXT[]
WHERE "identityDocumentUrls" IS NULL;

ALTER TABLE "TalentProfile"
ALTER COLUMN "identityDocumentUrls" SET NOT NULL;