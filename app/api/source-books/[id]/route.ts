import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'node:fs/promises';
import path from 'node:path';

type RouteContext = {
  params: {
    id: string;
  };
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(req: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = Number(params.id);
  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const sourceBook = await prisma.sourceBook.findUnique({
    where: { id },
  });

  if (!sourceBook) {
    return NextResponse.json({ error: 'Source book not found' }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.page.deleteMany({ where: { sourceBookId: id } }),
    prisma.sourceBook.delete({ where: { id } }),
  ]);

  if (sourceBook.filePath) {
    const basename = sourceBook.filePath.replace(/^\/(files|uploads)\//, '');
    if (basename) {
      const resolvedPath = path.join(process.cwd(), 'public', 'uploads', basename);
      try {
        await fs.unlink(resolvedPath);
      } catch (error: any) {
        if (error?.code !== 'ENOENT') {
          console.warn('Failed to delete file', resolvedPath, error);
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}

