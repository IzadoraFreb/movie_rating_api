'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, message } from '@/lib/api';
import { useResource } from '@/lib/use-resource';
import type { Activity, Movie } from '@/lib/types';
import { useAuth } from '../components/AuthProvider';
import { SiteShell } from '../components/SiteShell';
import {
  UserProfileLink,
  Back,
  Badge,
  Feedback,
  Icon,
  Poster,
  Rating,
  State,
  date,
} from '../components/ui';
export default function MovieDetail({ id }: { id: string }) {
  const movie = useResource<Movie>('/movies/' + id);
  const { user, refresh } = useAuth();
  const activity = useResource<Activity>(
    user ? '/movies/' + id + '/activity' : null,
  );
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  function requireLogin() {
    if (user) return true;
    router.push('/login?next=' + encodeURIComponent('/filmes/' + id));
    return false;
  }
  async function update(action: 'watchlist' | 'watched') {
    if (!requireLogin()) return;
    setBusy(true);
    setError('');
    try {
      if (action === 'watchlist')
        await api('/watchlist/' + id, {
          method: activity.data?.inWatchlist ? 'DELETE' : 'POST',
        });
      else await api('/movies/' + id + '/watched', { method: 'PUT' });
      activity.reload();
      await refresh();
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  const data = movie.data;
  return (
    <SiteShell>
      <Back />
      {movie.loading || movie.error || !data ? (
        <State
          loading={movie.loading}
          error={movie.error}
          onRetry={movie.reload}
        />
      ) : (
        <>
          <section className="movie-detail">
            <Poster movie={data} slot="detail" />
            <div className="movie-information">
              <div className="movie-intro">
                <h1>{data.title}</h1>
                <p className="muted">
                  {[
                    data.releaseYear,
                    data.duration ? data.duration + ' min' : null,
                    data.director ? 'Direção de ' + data.director : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <div className="badges">
                  {data.genres.map((genre) => (
                    <Link href={'/filmes?genre=' + genre.id} key={genre.id}>
                      <Badge>{genre.name}</Badge>
                    </Link>
                  ))}
                </div>
              </div>
              <p className="synopsis">
                {data.synopsis ||
                  'Este filme ainda não tem uma sinopse cadastrada.'}
              </p>
              <div className="community-rating">
                <div className="average-badge">
                  <Rating value={data.averageRating} large />
                  {data.averageRating !== null && (
                    <span className="muted">/ 5</span>
                  )}
                </div>
                <div>
                  <strong>Média da comunidade</strong>
                  <small className="muted">{data.ratingCount} avaliações</small>
                </div>
              </div>
              <div className="movie-actions">
                <button
                  className="button"
                  disabled={busy || activity.loading || activity.data?.watched}
                  onClick={() => void update('watched')}
                >
                  <Icon name="check" />
                  {activity.data?.watched
                    ? 'Assistido'
                    : 'Marcar como assistido'}
                </button>
                <button
                  className="button"
                  disabled={busy || activity.loading}
                  onClick={() => void update('watchlist')}
                >
                  <Icon name={activity.data?.inWatchlist ? 'check' : 'plus'} />
                  {activity.data?.inWatchlist
                    ? 'Na Watchlist'
                    : 'Adicionar à Watchlist'}
                </button>
                <button
                  className="button primary"
                  onClick={() => {
                    if (requireLogin())
                      router.push('/filmes/' + id + '/avaliar');
                  }}
                >
                  <Icon name="starWhite" />
                  {activity.data?.review ? 'Editar avaliação' : 'Avaliar'}
                </button>
              </div>
              <Feedback error={error || activity.error} />
            </div>
          </section>
          <hr />
          <section>
            <div className="section-heading">
              <h2>Avaliações dos usuários</h2>
              <span className="muted">Mais recentes primeiro</span>
            </div>
            {data.reviews?.length ? (
              <div className="review-grid">
                {data.reviews.map((review) => (
                  <article className="panel review-card" key={review.id}>
                    <div className="section-heading">
                      <UserProfileLink user={review.user} avatar>
                        <small className="muted">
                          {date(review.watchedAt)}
                        </small>
                      </UserProfileLink>
                      <Rating value={review.rating} large />
                    </div>
                    <p>
                      {review.comment ||
                        'O usuário avaliou este filme sem comentário.'}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <State empty="Este filme ainda não recebeu avaliações" />
            )}
          </section>
        </>
      )}
    </SiteShell>
  );
}
