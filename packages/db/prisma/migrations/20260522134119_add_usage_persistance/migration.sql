/*
  Warnings:

  - You are about to drop the column `completionTokens` on the `message` table. All the data in the column will be lost.
  - You are about to drop the column `intent` on the `message` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `message` table. All the data in the column will be lost.
  - You are about to drop the column `promptTokens` on the `message` table. All the data in the column will be lost.
  - You are about to drop the column `totalTokens` on the `message` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "message" DROP COLUMN "completionTokens",
DROP COLUMN "intent",
DROP COLUMN "model",
DROP COLUMN "promptTokens",
DROP COLUMN "totalTokens";

-- CreateTable
CREATE TABLE "usage_record" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "userId" UUID,
    "messageId" UUID,
    "role" "MessageRole" NOT NULL,
    "model" TEXT,
    "intent" "MessageIntent",
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usage_record_messageId_key" ON "usage_record"("messageId");

-- AddForeignKey
ALTER TABLE "usage_record" ADD CONSTRAINT "usage_record_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_record" ADD CONSTRAINT "usage_record_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
