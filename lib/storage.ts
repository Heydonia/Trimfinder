import { PutObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import path from 'node:path';
import fs from 'node:fs/promises';

const STORAGE_PREFIX = process.env.STORAGE_PREFIX ?? 'uploads';
const S3_BUCKET = process.env.S3_BUCKET;
const S3_REGION = process.env.S3_REGION;
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_PUBLIC_URL_BASE = process.env.S3_PUBLIC_URL_BASE;

const hasS3Config =
  !!S3_BUCKET && !!S3_REGION && !!S3_ACCESS_KEY_ID && !!S3_SECRET_ACCESS_KEY;

const s3Client = hasS3Config
  ? new S3Client({
      region: S3_REGION!,
      endpoint: S3_ENDPOINT,
      forcePathStyle: Boolean(S3_ENDPOINT),
      credentials: {
        accessKeyId: S3_ACCESS_KEY_ID!,
        secretAccessKey: S3_SECRET_ACCESS_KEY!,
      },
    })
  : null;

function normalizeKey(raw: string): string {
  if (!raw) return `${STORAGE_PREFIX}/`;
  const withoutLeadingSlash = raw.replace(/^\/+/, '');
  if (withoutLeadingSlash.startsWith(`${STORAGE_PREFIX}/`)) {
    return withoutLeadingSlash;
  }
  return `${STORAGE_PREFIX}/${withoutLeadingSlash}`;
}

export function isRemoteStorageEnabled() {
  return Boolean(s3Client);
}

export async function savePdf(buffer: Buffer, fileName: string): Promise<string> {
  const fileKey = normalizeKey(fileName);

  if (s3Client) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET!,
        Key: fileKey,
        Body: buffer,
        ContentType: 'application/pdf',
      })
    );
  } else {
    const uploadsDir = path.join(process.cwd(), 'public', STORAGE_PREFIX);
    await fs.mkdir(uploadsDir, { recursive: true });
    const targetPath = path.join(uploadsDir, path.basename(fileKey));
    await fs.writeFile(targetPath, buffer);
  }

  return fileKey;
}

export async function deleteStoredFile(storedPath: string | null | undefined) {
  if (!storedPath) return;
  const fileKey = normalizeKey(storedPath);

  if (s3Client) {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: S3_BUCKET!,
        Key: fileKey,
      })
    );
  } else {
    const filePath = path.join(process.cwd(), 'public', STORAGE_PREFIX, path.basename(fileKey));
    await fs.unlink(filePath).catch((error: any) => {
      if (error?.code !== 'ENOENT') {
        throw error;
      }
    });
  }
}

export function getPublicUrl(storedPath: string | null | undefined): string {
  if (!storedPath) return '';
  if (storedPath.startsWith('http://') || storedPath.startsWith('https://')) {
    return storedPath;
  }

  const fileKey = normalizeKey(storedPath);

  if (s3Client) {
    if (S3_PUBLIC_URL_BASE) {
      return `${S3_PUBLIC_URL_BASE.replace(/\/$/, '')}/${fileKey}`;
    }
    if (S3_ENDPOINT && !S3_ENDPOINT.includes('amazonaws.com')) {
      return `${S3_ENDPOINT.replace(/\/$/, '')}/${S3_BUCKET}/${fileKey}`;
    }
    return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${fileKey}`;
  }

  return `/${fileKey}`;
}


