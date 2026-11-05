'use client';

import Link from 'next/link';
import { useResource } from '@/lib/use-resource';
import type { PublicProfile, Review } from '@/lib/types';
import { useAuth } from '../components/AuthProvider';
import { SiteShell } from '../components/SiteShell';
import { ProfileBanner } from '../components/ProfileBanner';
import { Avatar, Back, Poster, Rating, State, date } from '../components/ui';
import styles from './Profile.module.css';

export default function Profile({ username }: { username: string }) {
  const { user } = useAuth();
  const path = '/users/' + encodeURIComponent(username);
  const profile = useResource<PublicProfile>(path);
  const reviews = useResource<Review[]>(
    profile.data ? path + '/reviews' : null,
  );
  const data = profile.data;
  const owner = Boolean(user && data && user.id === data.id);

  return (
    <SiteShell>
      <Back />
      {profile.loading || profile.error || !data ? (
        <State
          loading={profile.loading}
          error={profile.error}
          onRetry={profile.reload}
        />
      ) : (
        <>
          <section
            className={'panel ' + styles.profile}
            aria-label="Perfil do usuário"
          >
            {data.bannerUrl && <ProfileBanner src={data.bannerUrl} />}
            <div className={styles.identityRow}>
              <div className={'user-identity ' + styles.identity}>
                <Avatar user={data} large />
                <div>
                  <h1>{data.displayName || data.username}</h1>
                  <p className="muted">@{data.username}</p>
                  <small className="muted">
                    Membro desde{' '}
                    {new Date(data.createdAt).toLocaleDateString('pt-BR', {
                      month: 'long',
                      year: 'numeric',
                      timeZone: 'UTC',
                    })}
                  </small>
                </div>
              </div>
              {owner && (
                <Link className="button" href="/minha-area/editar">
                  Editar perfil
                </Link>
              )}
            </div>
            {data.bio && <p className={styles.bio}>{data.bio}</p>}
            <dl className={styles.stats}>
              <div>
                <dt>Filmes assistidos</dt>
                <dd>{data._count.watched}</dd>
              </div>
              <div>
                <dt>Avaliações</dt>
                <dd>{data._count.reviews}</dd>
              </div>
            </dl>
          </section>
          <section aria-labelledby="profile-reviews-title">
            <div className="section-heading">
              <h2 id="profile-reviews-title">Avaliações publicadas</h2>
              <span className="muted">Mais recentes primeiro</span>
            </div>
            {reviews.loading || reviews.error ? (
              <State
                loading={reviews.loading}
                error={reviews.error}
                onRetry={reviews.reload}
              />
            ) : reviews.data?.length ? (
              <div className={styles.reviews}>
                {reviews.data.map((review) => (
                  <article className={'panel ' + styles.review} key={review.id}>
                    <div className="section-heading">
                      <Link
                        className="movie-identity"
                        href={'/filmes/' + review.movie.id}
                      >
                        <Poster movie={review.movie} slot="table" />
                        <div>
                          <h3>{review.movie.title}</h3>
                          <small className="muted">
                            {review.movie.releaseYear}
                          </small>
                        </div>
                      </Link>
                      <Rating value={review.rating} large />
                    </div>
                    <p className={styles.comment}>
                      {review.comment || 'Avaliou este filme sem comentário.'}
                    </p>
                    <small className="muted">
                      Assistido em {date(review.watchedAt)}
                    </small>
                  </article>
                ))}
              </div>
            ) : (
              <div className={'panel ' + styles.empty}>
                <p>
                  {owner
                    ? 'Você ainda não publicou avaliações.'
                    : 'Este perfil ainda não publicou avaliações.'}
                </p>
                {owner && (
                  <Link className="accent" href="/filmes">
                    Explorar filmes para avaliar →
                  </Link>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </SiteShell>
  );
}
