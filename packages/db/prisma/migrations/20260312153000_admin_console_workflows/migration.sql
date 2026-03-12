ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'HEADHUNTER';

CREATE TYPE "DemandApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'CHANGES_REQUESTED');

CREATE TYPE "ExternalCandidateSubmissionStatus" AS ENUM ('SUBMITTED', 'REVIEWED', 'SHORTLISTED', 'REJECTED');

ALTER TABLE "User"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "TalentProfile"
ADD COLUMN "verificationNotes" TEXT,
ADD COLUMN "verifiedAt" TIMESTAMP(3);

ALTER TABLE "Demand"
ADD COLUMN "approvalStatus" "DemandApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "approvalNotes" TEXT,
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "hardToFill" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Demand"
SET
  "approvalStatus" = CASE
    WHEN "status" IN ('ACTIVE', 'PAUSED', 'FILLED') THEN 'APPROVED'::"DemandApprovalStatus"
    ELSE 'PENDING'::"DemandApprovalStatus"
  END,
  "approvedAt" = CASE
    WHEN "status" IN ('ACTIVE', 'PAUSED', 'FILLED') THEN NOW()
    ELSE NULL
  END;

CREATE TABLE "HeadhunterAssignment" (
  "id" UUID NOT NULL,
  "demandId" UUID NOT NULL,
  "headhunterUserId" UUID NOT NULL,
  "assignedByAdminId" UUID NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "HeadhunterAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExternalCandidateSubmission" (
  "id" UUID NOT NULL,
  "demandId" UUID NOT NULL,
  "headhunterUserId" UUID NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "headline" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "availability" "AvailabilityWindow" NOT NULL,
  "hourlyRate" DECIMAL(10,2),
  "notes" TEXT,
  "resumeUrl" TEXT,
  "status" "ExternalCandidateSubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
  "reviewNotes" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ExternalCandidateSubmission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "HeadhunterAssignment_demandId_headhunterUserId_key" ON "HeadhunterAssignment"("demandId", "headhunterUserId");
CREATE INDEX "HeadhunterAssignment_headhunterUserId_idx" ON "HeadhunterAssignment"("headhunterUserId");
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");
CREATE INDEX "Demand_approvalStatus_idx" ON "Demand"("approvalStatus");
CREATE INDEX "Demand_hardToFill_idx" ON "Demand"("hardToFill");
CREATE INDEX "ExternalCandidateSubmission_demandId_status_idx" ON "ExternalCandidateSubmission"("demandId", "status");
CREATE INDEX "ExternalCandidateSubmission_headhunterUserId_createdAt_idx" ON "ExternalCandidateSubmission"("headhunterUserId", "createdAt");

ALTER TABLE "HeadhunterAssignment"
ADD CONSTRAINT "HeadhunterAssignment_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "Demand"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "HeadhunterAssignment_headhunterUserId_fkey" FOREIGN KEY ("headhunterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "HeadhunterAssignment_assignedByAdminId_fkey" FOREIGN KEY ("assignedByAdminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExternalCandidateSubmission"
ADD CONSTRAINT "ExternalCandidateSubmission_demandId_fkey" FOREIGN KEY ("demandId") REFERENCES "Demand"("id") ON DELETE CASCADE ON UPDATE CASCADE,
ADD CONSTRAINT "ExternalCandidateSubmission_headhunterUserId_fkey" FOREIGN KEY ("headhunterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;