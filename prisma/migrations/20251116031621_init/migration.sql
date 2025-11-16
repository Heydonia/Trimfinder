-- CreateTable
CREATE TABLE "SourceBook" (
    "id" SERIAL NOT NULL,
    "modelName" TEXT NOT NULL,
    "year" INTEGER,
    "filePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SourceBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" SERIAL NOT NULL,
    "sourceBookId" INTEGER NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "Page_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Page_sourceBookId_fkey" FOREIGN KEY ("sourceBookId") REFERENCES "SourceBook"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Page_sourceBookId_pageNumber_idx" ON "Page"("sourceBookId", "pageNumber");

-- CreateIndex
CREATE INDEX "Page_text_idx" ON "Page" USING btree ("text");
