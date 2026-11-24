/*
  Warnings:

  - A unique constraint covering the columns `[tmdbId]` on the table `Movie` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Movie" ADD COLUMN "tmdbId" INTEGER;
ALTER TABLE "Movie" ADD COLUMN "tmdbUpdatedAt" DATETIME;

-- CreateIndex
CREATE UNIQUE INDEX "Movie_tmdbId_key" ON "Movie"("tmdbId");
