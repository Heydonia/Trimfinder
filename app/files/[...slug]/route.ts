import { NextResponse } from 'next/server';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteParams = {
  slug?: string[];
};

export async function GET(_: Request, { params }: { params: RouteParams }) {
  const segments = params.slug ?? [];
  if (segments.length === 0) {
    return NextResponse.json({ error: 'File not specified' }, { status: 400 });
  }

  const safeSegments = segments.map((segment) => segment.replace(/\.\./g, '')).filter(Boolean);
  const relativePath = safeSegments.join('/');
  const filePath = path.join(process.cwd(), 'public', 'uploads', relativePath);

  try {
    const info = await stat(filePath);
    if (!info.isFile()) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const stream = createReadStream(filePath);
  const filename = safeSegments[safeSegments.length - 1] ?? 'file.pdf';

  const readable = Readable.toWeb(stream) as ReadableStream;

  return new NextResponse(readable, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

