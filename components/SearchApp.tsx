'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import type { SearchResult, SourceBookSummary } from '@/types';

type SearchResponse = {
  results: SearchResult[];
};

export function SearchApp() {
  const { data: session } = useSession();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [library, setLibrary] = useState<SourceBookSummary[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [libraryFilter, setLibraryFilter] = useState('');

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!libraryOpen) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeLibrary();
      }
    }
    window.addEventListener('keydown', handleKey);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = originalOverflow;
    };
  }, [libraryOpen]);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value) {
      setResults([]);
      setError(null);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
      if (!res.ok) {
        throw new Error('Search failed');
      }
      const data: SearchResponse = await res.json();
      setResults(data.results);
      if (data.results.length > 0) {
        window.open(`${data.results[0].filePath}#page=${data.results[0].pageNumber}`, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error(err);
      setError('Unable to search right now.');
    } finally {
      setLoading(false);
    }
  }

  async function loadLibrary() {
    setLibraryLoading(true);
    setLibraryError(null);
    try {
      const res = await fetch('/api/library', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Unable to load PDFs');
      }
      const data = await res.json();
      setLibrary(data.sourceBooks ?? []);
    } catch (err) {
      console.error(err);
      setLibraryError('Unable to load PDFs right now.');
    } finally {
      setLibraryLoading(false);
    }
  }

  function openLibrary() {
    setLibraryOpen(true);
    if (!library.length && !libraryLoading) {
      void loadLibrary();
    }
  }

  function closeLibrary() {
    setLibraryOpen(false);
  }

  const filteredLibrary = useMemo(() => {
    if (!libraryFilter.trim()) return library;
    const query = libraryFilter.trim().toLowerCase();
    return library.filter((book) => {
      const label = `${book.modelName} ${book.year ?? ''} ${book.pageCount}`;
      return label.toLowerCase().includes(query);
    });
  }, [library, libraryFilter]);

  return (
    <main className="home">
      <div className="actions row">
        {session?.user?.role === 'admin' && (
          <>
            <Link className="pill ghost" href="/accounts">
              Accounts
            </Link>
            <Link className="pill ghost" href="/upload">
              Upload PDF
            </Link>
          </>
        )}
        <button className="pill ghost" onClick={() => signOut({ callbackUrl: '/login' })}>
          Sign out
        </button>
      </div>
      <div className="homeContent">
        <header className="hero">
          <span className="badge">TOYOTA SOURCE BOOKS</span>
          <h1>TrimFinder</h1>
          <p>Jump straight to the Toyota page that mentions your feature.</p>
        </header>

        <form className="search" onSubmit={handleSearch}>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Search e.g. "rav4 xle sunroof"'
            aria-label="Search source books"
          />
          <button type="submit" className="searchButton" disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </button>
          <button type="button" className="libraryToggle" onClick={openLibrary}>
            PDF Library
          </button>
        </form>



        {error && <p className="status error">{error}</p>}
        {loading && !error && <p className="status">Finding the right pages…</p>}
        {hasSearched && !loading && results.length === 0 && !error && (
          <p className="status">
            No pages matched that search yet. Try a different query or <Link href="/upload">upload a PDF</Link>.
          </p>
        )}

        {results.length > 0 && (
          <p className="status">
            Opened {results[0].modelName} page {results[0].pageNumber} in a new tab. Refine your search to jump somewhere else.
          </p>
        )}
      </div>

      <p className="disclaimer">For internal dealership use only. TrimFinder is not affiliated with Toyota.</p>

      {libraryOpen && (
        <div className="libraryOverlay" role="dialog" aria-modal="true" aria-label="PDF library" onClick={closeLibrary}>
          <div className="libraryModal" onClick={(event) => event.stopPropagation()}>
            <header className="libraryHeader">
              <div>
                <p className="libraryEyebrow">Uploaded PDFs</p>
                <h2>Source Book Library</h2>
              </div>
              <button type="button" className="pill ghost" onClick={closeLibrary}>
                Close
              </button>
            </header>

            <div className="libraryControls">
              <input
                className="librarySearch"
                type="text"
                placeholder="Filter by model, year, or trim"
                value={libraryFilter}
                onChange={(event) => setLibraryFilter(event.target.value)}
              />
              <button type="button" className="pill" onClick={() => loadLibrary()} disabled={libraryLoading}>
                {libraryLoading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>

            <div className="libraryBody">
              {libraryLoading && library.length === 0 && <p className="status">Loading library…</p>}
              {libraryError && <p className="status error">{libraryError}</p>}
              {!libraryLoading && !libraryError && filteredLibrary.length === 0 && (
                <p className="status">{library.length ? 'No PDFs match that filter.' : 'No PDFs uploaded yet.'}</p>
              )}
              {filteredLibrary.length > 0 && (
                <ul className="libraryList">
                  {filteredLibrary.map((book) => (
                    <li key={book.id} className="libraryRow">
                      <div>
                        <strong>
                          {book.modelName} {book.year ?? ''}
                        </strong>
                        <p className="libraryMeta">
                          {book.pageCount} pages · uploaded {new Date(book.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="libraryActions">
                        <a href={`${book.filePath}#page=1`} target="_blank" rel="noreferrer">
                          Open PDF ↗
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
