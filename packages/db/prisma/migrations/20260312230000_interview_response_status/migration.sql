-- CreateEnum
CREATE TYPE "InterviewResponseStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "Interview"
ADD COLUMN "talentResponseStatus" "InterviewResponseStatus" NOT NULL DEFAULT 'PENDING';