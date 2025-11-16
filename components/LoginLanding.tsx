'use client';

import { useEffect, useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

export function LoginLanding() {
  const [form, setForm] = useState({ email: '', password: '', rememberMe: false });
  const [statusMessage, setStatusMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, type, checked, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setStatusMessage('Signing in…');

    const result = await signIn('credentials', {
      redirect: false,
      email: form.email,
      password: form.password,
      callbackUrl,
      rememberMe: form.rememberMe,
    });

    if (result?.error) {
      setStatusMessage('Invalid credentials. Please try again.');
      setSubmitting(false);
      return;
    }

    setStatusMessage('Success! Redirecting…');
    const target = result?.url ?? callbackUrl;
    router.replace(target);
    window.location.href = target;
  }

  return (
    <main className="home">
      <div className="authShell">
        <header className="hero">
          <span className="badge">TrimFinder</span>
          <h1>Dealer Login</h1>
          <p>Secure Toyota source-book access for internal teams.</p>
        </header>

        <form className="authCard" onSubmit={handleSubmit}>
          <input
            name="email"
            type="email"
            placeholder="Work email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />
          <label className="rememberRow">
            <input
              type="checkbox"
              name="rememberMe"
              checked={form.rememberMe}
              onChange={handleChange}
            />
            <span className="rememberLabel">Keep me signed in on this device</span>
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Signing In…' : 'Sign In'}
          </button>
          {statusMessage && <p className="status">{statusMessage}</p>}
        </form>

        <p className="authHint">
          Need access? Contact your GSM or admin to request a TrimFinder login.
        </p>
      </div>

      <p className="disclaimer">For internal dealership use only. TrimFinder is not affiliated with Toyota.</p>
    </main>
  );
}
