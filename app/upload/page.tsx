'use client';

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { SourceBookSummary } from '@/types';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [modelName, setModelName] = useState('');
  const [year, setYear] = useState('');
  const [status, setStatus] = useState('');
  const [books, setBooks] = useState<SourceBookSummary[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { status: sessionStatus, data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      if ((session?.user as any)?.role !== 'admin') {
        router.replace('/');
      } else {
        loadBooks();
      }
    } else if (sessionStatus === 'unauthenticated') {
      router.replace('/login');
    }
  }, [sessionStatus, session, router]);

  async function loadBooks() {
    setLoadingBooks(true);
    try {
      const res = await fetch('/api/source-books');
      if (!res.ok) {
        throw new Error('Unable to load PDFs');
      }
      const data = await res.json();
      setBooks(data.sourceBooks ?? []);
    } catch (error) {
      console.error(error);
      setStatus('Unable to load PDFs right now.');
    } finally {
      setLoadingBooks(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    if (!file) {
      setStatus('Please choose a PDF file.');
      return;
    }
    if (!modelName.trim()) {
      setStatus('Model name is required.');
      return;
    }

    setStatus('Uploading…');

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('modelName', modelName.trim().toUpperCase());
      if (year.trim()) form.append('year', year.trim());

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? 'Upload failed');
      }

      setStatus(`Uploaded ${data.pagesInserted} pages.`);
      setFile(null);
      setModelName('');
      setYear('');
      formElement.reset();
      await loadBooks();
    } catch (error: any) {
      setStatus(error.message ?? 'Upload failed.');
    }
  }

  async function onDelete(id: number, label: string) {
    const confirmed = window.confirm(`Delete ${label} from the database? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setDeletingId(id);
      setStatus('Deleting…');
      const res = await fetch(`/api/source-books/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? 'Delete failed');
      }
      setStatus('Source book deleted.');
      await loadBooks();
    } catch (error: any) {
      setStatus(error.message ?? 'Delete failed.');
    } finally {
      setDeletingId(null);
    }
  }

  if (sessionStatus === 'loading') {
    return (
      <div className="container" style={{ minHeight: '100vh' }}>
        <p className="status">Checking access…</p>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Upload Source Book</h1>
        <div className="headerButtons">
          <a className="pill" href="/">
            Back to search
          </a>
          <button type="button" className="pill ghost" onClick={() => signOut({ callbackUrl: '/login' })}>
            Sign out
          </button>
        </div>
      </header>

      <form className="uploadForm" onSubmit={onSubmit}>
        <input
          type="text"
          placeholder='Model name (e.g., "RAV4")'
          value={modelName}
          onChange={(event) => setModelName(event.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Year (optional)"
          value={year}
          onChange={(event) => setYear(event.target.value)}
        />

        <input
          type="file"
          accept="application/pdf"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          required
        />

        <button type="submit">Upload & Index</button>

        <div className="status" aria-live="polite">
          {status}
        </div>
      </form>

      <section className="sourceBooks">
        <h2>Existing PDFs</h2>
        {loadingBooks ? (
          <p className="status">Loading…</p>
        ) : books.length === 0 ? (
          <p className="status">No PDFs uploaded yet.</p>
        ) : (
          <ul className="sourceBooksList">
            {books.map((book) => (
              <li key={book.id} className="sourceBookRow">
                <div>
                  <strong>
                    {book.modelName} {book.year ?? ''}
                  </strong>
                  <p className="sourceBookMeta">
                    {book.pageCount} pages · uploaded {new Date(book.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="sourceBookActions">
                  <a href={book.filePath} target="_blank" rel="noreferrer">
                    View PDF ↗
                  </a>
                  <button
                    type="button"
                    className="deleteButton"
                    onClick={() => onDelete(book.id, `${book.modelName} ${book.year ?? ''}`.trim())}
                    disabled={deletingId === book.id}
                  >
                    {deletingId === book.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

