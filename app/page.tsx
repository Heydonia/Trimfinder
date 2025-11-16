import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SearchApp } from '@/components/SearchApp';
import { LoginLanding } from '@/components/LoginLanding';

export default async function RootPage() {
  const session = await getServerSession(authOptions);
  return session ? <SearchApp /> : <LoginLanding />;
}
