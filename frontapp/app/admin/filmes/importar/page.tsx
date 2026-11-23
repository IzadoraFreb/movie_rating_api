'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api, message } from '@/lib/api';
import { RequireAuth } from '../../../components/AuthProvider';
import {
  Feedback,
  PageTitle,
  Poster,
  Search,
} from '../../../components/ui';

type MovieResult = {
  tmdbId: number;
  title: string;
  synopsis: string | null;
  releaseYear: number | null;
  posterPath: string | null;
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
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<number | null>(null);
  const [error, setError] = useState('');

  const busy = loading || importing !== null;
  const totalPages = Math.min(result?.totalPages ?? 0, 500);

  async function searchMovies(query: string, page: number) {
    setLoading(true);
    setError('');

    try {
      const response = await api<SearchResponse>(
        `/tmdb/search?q=${encodeURIComponent(query)}&page=${page}`,
      );

      setResult(response);
      setSubmittedSearch(query);
    } catch (error) {
      setError(message(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = search.trim();

    if (!query) {
      setError('Digite o nome de um filme.');
      return;
    }

    await searchMovies(query, 1);
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
      <PageTitle
        title="Importar do TMDB"
        description="Pesquise um filme para adicionar ao catálogo."
        action={
          <Link className="button" href="/admin/filmes">
            Voltar aos filmes
          </Link>
        }
      />

      <form onSubmit={handleSearch}>
        <fieldset
          disabled={busy}
          style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
        >
          <div className="list-toolbar">
            <Search
              value={search}
              onChange={setSearch}
              placeholder="Buscar filme no TMDB"
            />

            <button className="button primary" type="submit">
              {loading ? 'Pesquisando…' : 'Pesquisar'}
            </button>
          </div>
        </fieldset>
      </form>

      <Feedback error={error} />

      {loading && <p role="status">Carregando filmes…</p>}

      {!loading && result && (
        <>
          <p className="muted" role="status">
            {result.total} resultados para “{submittedSearch}”.
          </p>

          {result.data.length === 0 && (
            <p>Nenhum filme encontrado. Tente outro título.</p>
          )}

          {result.data.map((movie) => (
            <article
              key={movie.tmdbId}
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 20,
                padding: '20px 0',
                borderBottom: '1px solid #777',
              }}
            >
              <div style={{ width: 100, flexShrink: 0 }}>
                <Poster
                  slot="table"
                  movie={{
                    title: movie.title,
                    posterUrl: movie.posterPath
                      ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
                      : null,
                  }}
                />
              </div>

              <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                <h2>
                  {movie.title}
                  {movie.releaseYear
                    ? ` (${movie.releaseYear})`
                    : ''}
                </h2>

                <p>
                  {movie.synopsis || 'Sinopse não disponível.'}
                </p>

                <button
                  className="button primary"
                  type="button"
                  disabled={busy}
                  onClick={() => void handleImport(movie.tmdbId)}
                >
                  {importing === movie.tmdbId
                    ? 'Importando…'
                    : 'Adicionar ao catálogo'}
                </button>
              </div>
            </article>
          ))}

          {totalPages > 1 && (
            <nav
              className="inline"
              aria-label="Páginas dos resultados do TMDB"
              style={{ marginTop: 24 }}
            >
              <button
                className="button"
                type="button"
                disabled={busy || result.page <= 1}
                onClick={() =>
                  void searchMovies(submittedSearch, result.page - 1)
                }
              >
                Anterior
              </button>

              <span aria-live="polite">
                Página {result.page} de {totalPages}
              </span>

              <button
                className="button"
                type="button"
                disabled={busy || result.page >= totalPages}
                onClick={() =>
                  void searchMovies(submittedSearch, result.page + 1)
                }
              >
                Próxima
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}