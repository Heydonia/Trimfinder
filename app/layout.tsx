import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import './globals.css';
import { SessionProvider } from '@/components/session-provider';
import { authOptions } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'TrimFinder',
  description: 'Upload Toyota source books, search for features, and jump to the right PDF page.',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body>
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
