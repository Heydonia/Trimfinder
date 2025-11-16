import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

function toFileRoute(path: string | null): string {
  if (!path) return '';
  if (path.startsWith('/files/')) return path;
  if (path.startsWith('/uploads/')) {
    return `/files/${path.replace(/^\/uploads\//, '')}`;
  }
  return path;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const books = await prisma.sourceBook.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { pages: true },
      },
    },
  });

  return NextResponse.json({
    sourceBooks: books.map((book) => ({
      id: book.id,
      modelName: book.modelName,
      year: book.year,
      filePath: toFileRoute(book.filePath),
      createdAt: book.createdAt,
      pageCount: book._count.pages,
    })),
  });
}


