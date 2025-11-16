import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildSnippet, parseQuery, scorePage, toPublicPath } from '@/lib/search';
import type { SearchResult } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') ?? '').trim();

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const { models, keywords } = parseQuery(q);
  const normalizedKeywords = keywords.map((keyword) => keyword.toLowerCase());

  const sourceBookIds = models.length
    ? (
        await prisma.sourceBook.findMany({
          where: {
            modelName: {
              in: models.map((model) => model.toUpperCase()),
            },
          },
          select: { id: true },
        })
      ).map((entry) => entry.id)
    : undefined;

  if (models.length && !sourceBookIds?.length) {
    return NextResponse.json({ results: [] });
  }

  const pages = await prisma.page.findMany({
    where: {
      ...(sourceBookIds?.length ? { sourceBookId: { in: sourceBookIds } } : {}),
    },
    include: { sourceBook: true },
    take: 200,
  });

  const filteredPages =
    normalizedKeywords.length > 0
      ? pages.filter((page) =>
          normalizedKeywords.every((keyword) => page.text.toLowerCase().includes(keyword))
        )
      : pages;

  const results: SearchResult[] = filteredPages
    .map((page) => {
      const score = normalizedKeywords.length ? scorePage(page.text, normalizedKeywords) : 1;
      return {
        pageId: page.id,
        sourceBookId: page.sourceBookId,
        modelName: page.sourceBook.modelName,
        year: page.sourceBook.year,
        pageNumber: page.pageNumber,
        filePath: toPublicPath(page.sourceBook.filePath),
        snippet: buildSnippet(page.text, normalizedKeywords),
        score,
      };
    })
    .filter((entry) => entry.score > 0 || keywords.length === 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 100);

  return NextResponse.json({ results });
}

