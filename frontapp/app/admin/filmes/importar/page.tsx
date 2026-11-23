'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api, message } from '@/lib/api';
import { RequireAuth } from '../../../components/AuthProvider';

type MovieResult = {
  tmdbId: number;
  title: string;
  synopsis: string | null;
  releaseYear: number | null;
};

type SearchResponse = {
  page: number;
  totalPages: number;
  total: number;
  data: MovieResult[];
};

export default function ImportMoviesPage() {
  return (
    <RequireAuth admin>
      <ImportMovies />
    </RequireAuth>
  );
}

function ImportMovies() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [movies, setMovies] = useState<MovieResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = search.trim();

    if (!query) {
      setError('Digite o nome de um filme.');
      return;
    }

    setLoading(true);
    setError('');
    setMovies([]);
    setSearched(false);

    try {
      const result = await api<SearchResponse>(
        `/tmdb/search?q=${encodeURIComponent(query)}&page=1`,
      );

      setMovies(result.data);
      setSearched(true);
    } catch (error) {
      setError(message(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleImport(tmdbId: number) {
    setImporting(tmdbId);
    setError('');

    try {
      const movie = await api<{ id: string }>(
        `/tmdb/movies/${tmdbId}/import`,
        { method: 'POST' },
      );

      router.push(`/filmes/${movie.id}`);
    } catch (error) {
      setError(message(error));
    } finally {
      setImporting(null);
    }
  }

  return (
    <section>
      <h1>Importar filmes</h1>
      <p>Pesquise um título no TMDB para adicionar ao catálogo.</p>

      <form onSubmit={handleSearch}>
        <label htmlFor="movie-search">Nome do filme</label>

        <input
          id="movie-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Ex.: Interestelar"
          required
          disabled={loading || importing !== null}
        />

        <button
          className="button"
          type="submit"
          disabled={loading || importing !== null}
        >
          {loading ? 'Pesquisando…' : 'Pesquisar'}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}

      {searched && movies.length === 0 && (
        <p>Nenhum filme encontrado.</p>
      )}

      <div aria-live="polite">
        {movies.map((movie) => (
          <article
            key={movie.tmdbId}
            style={{
              padding: '16px 0',
              borderBottom: '1px solid #777',
            }}
          >
            <h2>
              {movie.title}
              {movie.releaseYear ? ` (${movie.releaseYear})` : ''}
            </h2>

            <p>{movie.synopsis || 'Sinopse não disponível.'}</p>

            <button
              className="button"
              type="button"
              disabled={importing !== null || loading}
              onClick={() => void handleImport(movie.tmdbId)}
            >
              {importing === movie.tmdbId
                ? 'Importando…'
                : 'Adicionar ao catálogo'}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}