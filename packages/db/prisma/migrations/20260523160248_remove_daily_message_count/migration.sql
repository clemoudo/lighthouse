/*
  Warnings:

  - You are about to drop the column `dailyMessageCount` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `lastMessageAt` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "dailyMessageCount",
DROP COLUMN "lastMessageAt";
