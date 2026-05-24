/*
  Warnings:

  - You are about to drop the column `chapterId` on the `chunk` table. All the data in the column will be lost.
  - You are about to drop the `chapter` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `documentId` to the `chunk` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "chapter" DROP CONSTRAINT "chapter_documentId_fkey";

-- DropForeignKey
ALTER TABLE "chapter" DROP CONSTRAINT "chapter_parentId_fkey";

-- DropForeignKey
ALTER TABLE "chunk" DROP CONSTRAINT "chunk_chapterId_fkey";

-- AlterTable
ALTER TABLE "chunk" DROP COLUMN "chapterId",
ADD COLUMN     "documentId" UUID NOT NULL;

-- DropTable
DROP TABLE "chapter";

-- AddForeignKey
ALTER TABLE "chunk" ADD CONSTRAINT "chunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
