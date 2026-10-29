-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "workId" TEXT;

-- CreateTable
CREATE TABLE "Work" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Work_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Work_key_key" ON "Work"("key");

-- CreateIndex
CREATE INDEX "Book_workId_idx" ON "Book"("workId");

-- AddForeignKey
ALTER TABLE "Book" ADD CONSTRAINT "Book_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE SET NULL ON UPDATE CASCADE;
