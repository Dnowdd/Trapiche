-- CreateEnum
CREATE TYPE "ReadingFormat" AS ENUM ('PRINT', 'EBOOK', 'AUDIO');

-- AlterTable
ALTER TABLE "ReadingSession" ADD COLUMN     "format" "ReadingFormat" NOT NULL DEFAULT 'PRINT',
ADD COLUMN     "progressEnd" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "UserBook" ADD COLUMN     "audioLength" INTEGER,
ADD COLUMN     "audioPosition" INTEGER,
ADD COLUMN     "format" "ReadingFormat" NOT NULL DEFAULT 'PRINT',
ADD COLUMN     "progressPercent" DOUBLE PRECISION;

