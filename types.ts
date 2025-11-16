export type SearchResult = {
  pageId: number;
  sourceBookId: number;
  modelName: string;
  year: number | null;
  pageNumber: number;
  filePath: string;
  snippet: string;
  score: number;
};

export type SourceBookSummary = {
  id: number;
  modelName: string;
  year: number | null;
  filePath: string;
  createdAt: string;
  pageCount: number;
};

