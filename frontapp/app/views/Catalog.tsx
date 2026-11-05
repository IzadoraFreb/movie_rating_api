'use client';
import Link from 'next/link';
import { useDeferredValue, useState, useEffect } from 'react';
import { useResource } from '@/lib/use-resource';
import { query } from '@/lib/api';
import type { Genre, Movie, PageResult } from '@/lib/types';
import { SiteShell } from '../components/SiteShell';
import {
  Badge,
  MovieCard,
  PageTitle,
  Pagination,
  Search,
  Select,
  State,
} from '../components/ui';
export default function Catalog({
  genresOnly = false,
}: {
  genresOnly?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [rating, setRating] = useState('');
  const [page, setPage] = useState(1);
  const deferred = useDeferredValue(search);
  const genres = useResource<Genre[]>('/genres');
  const filters = useResource<{ years: number[] }>('/movies/filters');
  const movies = useResource<PageResult<Movie>>(
    genresOnly
      ? null
      : '/movies?' +
          query({ q: deferred, genre, year, rating, page, limit: 12 }),
  );
  const change = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };
  return (
    <SiteShell>
      <PageTitle
        title={genresOnly ? 'Explore por gênero' : 'Encontre seu próximo filme'}
        description={
          genresOnly
            ? 'Encontre histórias do seu jeito.'
            : 'Explore o catálogo e descubra histórias que valem o seu tempo.'
        }
      />
      {genresOnly ? (
        genres.loading || genres.error ? (
          <State
            loading={genres.loading}
            error={genres.error}
            onRetry={genres.reload}
          />
        ) : (
          <div className="genre-grid">
            {genres.data?.map((g) => (
              <Link
                className="panel genre-card"
                href={'/filmes?genre=' + g.id}
                key={g.id}
              >
                <h2>{g.name}</h2>
                <Badge>{g._count?.movies || 0} filmes</Badge>
              </Link>
            ))}
          </div>
        )
      ) : (
        <>
          <CatalogFilters initialGenre={setGenre} />
          <div className="catalog-filters">
            <Search
              value={search}
              onChange={change(setSearch)}
              placeholder="Buscar por título ou direção"
            />
            <Select
              aria-label="Filtrar por gênero"
              value={genre}
              onChange={(e) => change(setGenre)(e.target.value)}
            >
              <option value="">Todos os gêneros</option>
              {genres.data?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Filtrar por ano"
              value={year}
              onChange={(e) => change(setYear)(e.target.value)}
            >
              <option value="">Todos os anos</option>
              {filters.data?.years.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </Select>
            <Select
              aria-label="Filtrar por nota"
              value={rating}
              onChange={(e) => change(setRating)(e.target.value)}
            >
              <option value="">Todas as notas</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} estrelas
                </option>
              ))}
              <option value="unrated">Sem avaliações</option>
            </Select>
          </div>
          {(genres.error || filters.error) && (
            <p className="error" role="alert">
              {genres.error || filters.error}
            </p>
          )}
          {movies.loading || movies.error ? (
            <State
              loading={movies.loading}
              error={movies.error}
              onRetry={movies.reload}
            />
          ) : (
            <section aria-label="Filmes do catálogo">
              <div className="results-summary">
                <span>{movies.data?.total || 0} filmes no catálogo</span>
                <span>Notas de 1 a 5 · média dos usuários</span>
              </div>
              {movies.data?.data.length ? (
                <div className="movie-grid">
                  {movies.data.data.map((movie) => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))}
                </div>
              ) : (
                <State empty="Nenhum filme encontrado" />
              )}
              {(movies.data?.total || 0) > 12 && (
                <Pagination
                  page={page}
                  total={movies.data!.total}
                  limit={12}
                  onChange={setPage}
                />
              )}
            </section>
          )}
        </>
      )}
    </SiteShell>
  );
}
function CatalogFilters({
  initialGenre,
}: {
  initialGenre: (genre: string) => void;
}) {
  useEffect(() => {
    const genre = new URLSearchParams(window.location.search).get('genre');
    if (genre) initialGenre(genre);
  }, [initialGenre]);
  return null;
}
