'use client';

import { SessionProvider as NextAuthProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import type { ReactNode } from 'react';

export function SessionProvider({ children, session }: { children: ReactNode; session: Session | null }) {
  return <NextAuthProvider session={session}>{children}</NextAuthProvider>;
}
