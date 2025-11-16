'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { SearchResult } from '@/types';

type SearchResponse = {
  results: SearchResult[];
};

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value) {
      setResults([]);
      setError(null);
      setHasSearched(false);
      return;
    }

    const pendingTab = typeof window !== 'undefined' ? window.open('', '_blank') : null;
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
      const data: SearchResponse = await res.json();
      setResults(data.results);
      if (data.results.length > 0) {
        const firstTarget = `${data.results[0].filePath}#page=${data.results[0].pageNumber}`;
        if (pendingTab) {
          pendingTab.location.replace(firstTarget);
        } else {
          window.open(firstTarget, '_blank', 'noopener,noreferrer');
        }
      } else if (pendingTab) {
        pendingTab.close();
      }
    } catch {
      setError('Something went wrong. Please try again.');
      if (pendingTab) pendingTab.close();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="home">
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
          <button type="submit" disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>

        <p className="helper">
          Need to add data? <Link href="/upload">Upload a PDF</Link>
        </p>

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
    </main>
  );
}
