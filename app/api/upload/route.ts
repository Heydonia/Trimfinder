import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { extractPdfPages } from '@/lib/pdf';
import { savePdf } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const file = form.get('file');
    const modelNameInput = form.get('modelName');
    const yearInput = form.get('year');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing PDF file.' }, { status: 400 });
    }

    const modelName = typeof modelNameInput === 'string' ? modelNameInput.trim() : '';
    if (!modelName) {
      return NextResponse.json({ error: 'Model name is required.' }, { status: 400 });
    }

    const year =
      typeof yearInput === 'string' && yearInput.trim().length > 0 ? Number(yearInput) : null;
    if (yearInput && Number.isNaN(year)) {
      return NextResponse.json({ error: 'Year must be a number.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const safeName =
      modelName.replace(/[^a-z0-9-_]/gi, '_') +
      (year ? `_${year}` : '') +
      `_${Date.now()}.pdf`;
    const storagePath = await savePdf(buffer, safeName);

    const pages = await extractPdfPages(buffer);

    const sourceBook = await prisma.sourceBook.create({
      data: {
        modelName: modelName.toUpperCase(),
        year,
        filePath: storagePath,
      },
    });

    if (pages.length) {
      await prisma.page.createMany({
        data: pages.map((text, index) => ({
          sourceBookId: sourceBook.id,
          pageNumber: index + 1,
          text,
          sectionTitle: null,
        })),
      });
    }

    return NextResponse.json({
      ok: true,
      sourceBookId: sourceBook.id,
      pagesInserted: pages.length,
    });
  } catch (error) {
    console.error('Upload error', error);
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 });
  }
}

