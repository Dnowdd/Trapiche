-- CreateEnum
CREATE TYPE "DatePrecision" AS ENUM ('YEAR', 'MONTH', 'DAY');

-- AlterTable
ALTER TABLE "Reading" ALTER COLUMN "startedAt" DROP NOT NULL,
ADD COLUMN     "startPrecision" "DatePrecision" NOT NULL DEFAULT 'DAY',
ADD COLUMN     "endPrecision" "DatePrecision" NOT NULL DEFAULT 'DAY';
