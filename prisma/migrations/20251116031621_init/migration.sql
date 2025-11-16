-- CreateTable
CREATE TABLE "SourceBook" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "modelName" TEXT NOT NULL,
    "year" INTEGER,
    "filePath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Page" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sourceBookId" INTEGER NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "Page_sourceBookId_fkey" FOREIGN KEY ("sourceBookId") REFERENCES "SourceBook" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Page_sourceBookId_pageNumber_idx" ON "Page"("sourceBookId", "pageNumber");

-- CreateIndex
CREATE INDEX "Page_text_idx" ON "Page"("text");
