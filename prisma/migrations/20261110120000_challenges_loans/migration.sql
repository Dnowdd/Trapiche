-- CreateEnum
CREATE TYPE "ChallengeKind" AS ENUM ('ANY', 'TAG', 'AUTHOR', 'LANGUAGE', 'FORMAT', 'LONG', 'SHORT');

-- AlterEnum
ALTER TYPE "NotificationKind" ADD VALUE 'LOAN_DUE';

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "loanId" TEXT;

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" "ChallengeKind" NOT NULL,
    "value" TEXT,
    "target" INTEGER NOT NULL,
    "startsAt" DATE NOT NULL,
    "endsAt" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "person" TEXT NOT NULL,
    "lentAt" DATE NOT NULL,
    "dueAt" DATE,
    "returnedAt" DATE,
    "note" TEXT,
    "remindedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Challenge_userId_endsAt_idx" ON "Challenge"("userId", "endsAt");

-- CreateIndex
CREATE INDEX "Loan_userId_returnedAt_idx" ON "Loan"("userId", "returnedAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

