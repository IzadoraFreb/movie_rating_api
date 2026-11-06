'use client';
import Link from 'next/link';
import { useState } from 'react';
import { api, message } from '@/lib/api';
import { useResource } from '@/lib/use-resource';
import type { Review, Watched, WatchlistItem } from '@/lib/types';
import { RequireAuth, useAuth } from '../components/AuthProvider';
import { SiteShell } from '../components/SiteShell';
import { ProfileBanner } from '../components/ProfileBanner';
import {
  Avatar,
  Badge,
  Feedback,
  Poster,
  Rating,
  State,
  date,
} from '../components/ui';
export default function Personal() {
  return (
    <SiteShell>
      <RequireAuth>
        <PersonalContent />
      </RequireAuth>
    </SiteShell>
  );
}
function PersonalContent() {
  const { user, refresh } = useAuth();
  const watched = useResource<Watched[]>('/users/me/watched');
  const reviews = useResource<Review[]>(
    '/users/' + user!.username + '/reviews',
  );
  const watchlist = useResource<WatchlistItem[]>('/watchlist');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  async function remove(id: string) {
    setBusy(id);
    setError('');
    try {
      await api('/watchlist/' + id, { method: 'DELETE' });
      watchlist.reload();
      await refresh();
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(null);
    }
  }
  return (
    <>
      <section className="panel profile-overview">
        {user!.bannerUrl && <ProfileBanner src={user!.bannerUrl} />}
        <div className="profile-summary">
          <div className="user-identity">
            <Link
              href={'/perfil/' + encodeURIComponent(user!.username)}
              aria-label="Abrir meu perfil"
            >
              <Avatar user={user!} large />
            </Link>
            <div>
              <h1>Minha área</h1>
              <p>
                <Link href={'/perfil/' + encodeURIComponent(user!.username)}>
                  {user!.displayName || user!.username}
                </Link>
              </p>
              <small className="muted">{user!.email}</small>
            </div>
          </div>
          <div className="profile-counts">
            {[
              [user!._count?.watched || 0, 'Filmes assistidos'],
              [user!._count?.reviews || 0, 'Avaliações'],
              [user!._count?.watchlist || 0, 'Na Watchlist'],
            ].map(([count, label]) => (
              <div key={label}>
                <strong>{count}</strong>
                <small className="muted">{label}</small>
              </div>
            ))}
          </div>
        </div>
        {user!.bio && <p className="profile-bio">{user!.bio}</p>}
      </section>
      <Feedback error={error} />
      <div className="personal-columns">
        <div className="personal-activity">
          <section className="panel">
            <h2>Histórico de filmes assistidos</h2>
            {watched.loading || watched.error ? (
              <State
                loading={watched.loading}
                error={watched.error}
                onRetry={watched.reload}
              />
            ) : watched.data?.length ? (
              <div className="history-list">
                {watched.data.map((item) => (
                  <div className="history-row" key={item.movie.id}>
                    <Link
                      className="movie-identity"
                      href={'/filmes/' + item.movie.id}
                    >
                      <Poster movie={item.movie} slot="history" />
                      <div>
                        {item.movie.title}
                        <small className="muted">
                          {item.movie.releaseYear} ·{' '}
                          {item.movie.genres
                            .map((genre) => genre.name)
                            .join(', ')}
                        </small>
                      </div>
                    </Link>
                    <span className="muted">{date(item.watchedAt)}</span>
                    <Rating value={item.movie.myRating} />
                  </div>
                ))}
              </div>
            ) : (
              <State empty="Seu histórico começa com o próximo filme" />
            )}
          </section>
          <section className="panel">
            <h2>Minhas avaliações publicadas</h2>
            {reviews.loading || reviews.error ? (
              <State
                loading={reviews.loading}
                error={reviews.error}
                onRetry={reviews.reload}
              />
            ) : reviews.data?.length ? (
              <div className="personal-review-list">
                {reviews.data.map((review) => (
                  <article key={review.id}>
                    <div className="section-heading">
                      <div className="inline">
                        <Link href={'/filmes/' + review.movie.id}>
                          {review.movie.title}
                        </Link>
                        <Rating value={review.rating} />
                      </div>
                      <Link
                        className="accent"
                        href={'/filmes/' + review.movie.id + '/avaliar'}
                      >
                        Editar avaliação
                      </Link>
                    </div>
                    <p className="muted">
                      {review.comment || 'Avaliação sem comentário.'}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <State empty="Você ainda não publicou avaliações" />
            )}
          </section>
        </div>
        <aside className="panel watchlist-panel">
          <div>
            <h2>Minha Watchlist</h2>
            <p className="muted">Os próximos da sua lista.</p>
          </div>
          {watchlist.loading || watchlist.error ? (
            <State
              loading={watchlist.loading}
              error={watchlist.error}
              onRetry={watchlist.reload}
            />
          ) : watchlist.data?.length ? (
            <>
              {watchlist.data.map(({ movie }) => (
                <div className="watchlist-row" key={movie.id}>
                  <Link href={'/filmes/' + movie.id}>
                    <Poster movie={movie} slot="watchlist" />
                  </Link>
                  <div>
                    <Link href={'/filmes/' + movie.id}>{movie.title}</Link>
                    <div className="inline muted">
                      <span>{movie.releaseYear}</span>
                      <Rating value={movie.averageRating} />
                    </div>
                    <button
                      className="text-button destructive"
                      disabled={busy !== null}
                      onClick={() => void remove(movie.id)}
                    >
                      {busy === movie.id ? 'Removendo…' : 'Remover filme'}
                    </button>
                  </div>
                </div>
              ))}
              <Badge>{watchlist.data.length} filmes para assistir</Badge>
            </>
          ) : (
            <State empty="Sua próxima descoberta entra aqui" />
          )}
        </aside>
      </div>
    </>
  );
}
