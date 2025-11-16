import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AccountsManager } from '@/components/AccountsManager';
import { authOptions } from '@/lib/auth';

export default async function AccountsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login?callbackUrl=/accounts');
  }
  if ((session.user as any)?.role !== 'admin') {
    return (
      <main className="home">
        <div className="homeContent">
          <p className="status error">Access restricted. Admins only.</p>
          <Link className="pill" href="/">
            Back to TrimFinder
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="home">
      <div className="homeContent">
        <header className="hero">
          <span className="badge">TRIMFINDER</span>
          <h1>Accounts</h1>
          <p>Add, remove, or change roles for dealership logins.</p>
        </header>
        <AccountsManager />
      </div>
    </main>
  );
}
