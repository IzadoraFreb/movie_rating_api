ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'USER';
ALTER TABLE "Movie" ADD COLUMN "duration" INTEGER;
CREATE TABLE "Genre" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT NOT NULL);
CREATE UNIQUE INDEX "Genre_name_key" ON "Genre"("name");
CREATE TABLE "_GenreToMovie" (
  "A" TEXT NOT NULL, "B" TEXT NOT NULL,
  CONSTRAINT "_GenreToMovie_A_fkey" FOREIGN KEY ("A") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "_GenreToMovie_B_fkey" FOREIGN KEY ("B") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "_GenreToMovie_AB_unique" ON "_GenreToMovie"("A", "B");
CREATE INDEX "_GenreToMovie_B_index" ON "_GenreToMovie"("B");
CREATE TABLE "WatchedMovie" (
  "userId" TEXT NOT NULL, "movieId" TEXT NOT NULL, "watchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("userId", "movieId"),
  CONSTRAINT "WatchedMovie_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WatchedMovie_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "WatchedMovie" ("userId", "movieId", "watchedAt") SELECT "userId", "movieId", "watchedAt" FROM "Review";
