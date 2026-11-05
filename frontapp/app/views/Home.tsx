'use client';

import Link from 'next/link';
import { useResource } from '@/lib/use-resource';
import type { Movie, Review } from '@/lib/types';
import { useAuth } from '../components/AuthProvider';
import { SiteShell } from '../components/SiteShell';
import {
  Avatar,
  Icon,
  MovieCard,
  Poster,
  Rating,
  State,
  date,
} from '../components/ui';
import styles from './Home.module.css';

type Highlights = { movies: Movie[]; recentReviews: Review[] };

export default function Home() {
  const { user, loading } = useAuth();
  const highlights = useResource<Highlights>('/movies/highlights');

  return (
    <SiteShell>
      <section className={styles.welcome} aria-labelledby="welcome-title">
        <div className={styles.introduction}>
          <span className={styles.eyebrow}>
            Um lugar para quem gosta de cinema
          </span>
          <h1 id="welcome-title">Todo filme merece uma boa conversa.</h1>
          <p>
            Descubra histórias, registre o que assistiu e compartilhe suas
            impressões. Sua próxima sessão começa aqui.
          </p>
          <div className={styles.actions}>
            <Link className="button primary" href="/filmes">
              Explorar filmes
            </Link>
            {!loading && (
              <Link
                className="button"
                href={user ? '/minha-area' : '/cadastro'}
              >
                {user ? 'Ir para minha área' : 'Crie sua conta'}
              </Link>
            )}
          </div>
        </div>
        <div className={styles.features}>
          <div>
            <span className={styles.featureIcon}>
              <Icon name="moviesActive" />
            </span>
            <div>
              <h2>Descubra o próximo favorito</h2>
              <p>Explore filmes por gênero, ano e avaliações.</p>
            </div>
          </div>
          <div>
            <span className={styles.featureIcon}>
              <Icon name="reviewsActive" />
            </span>
            <div>
              <h2>Registre sua experiência</h2>
              <p>Guarde seu histórico e dê voz à sua opinião.</p>
            </div>
          </div>
          <div>
            <span className={styles.featureIcon}>
              <Icon name="genresActive" />
            </span>
            <div>
              <h2>Organize sua próxima sessão</h2>
              <p>Salve na Watchlist o que você quer assistir.</p>
            </div>
          </div>
        </div>
      </section>

      {highlights.loading || highlights.error ? (
        <State
          loading={highlights.loading}
          error={highlights.error}
          onRetry={highlights.reload}
        />
      ) : (
        <>
          <section aria-labelledby="featured-title">
            <div className="section-heading">
              <h2 id="featured-title">Filmes em destaque</h2>
              <Link className="accent" href="/filmes">
                Ver todos os filmes →
              </Link>
            </div>
            {highlights.data?.movies.length ? (
              <div className="movie-grid">
                {highlights.data.movies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            ) : (
              <State empty="Novas histórias estão a caminho" />
            )}
          </section>

          <section aria-labelledby="recent-reviews-title">
            <div className="section-heading">
              <h2 id="recent-reviews-title">
                O que a comunidade está assistindo
              </h2>
              <span className="muted">Avaliações recentes</span>
            </div>
            {highlights.data?.recentReviews.length ? (
              <div className={styles.reviews}>
                {highlights.data.recentReviews.map((review) => (
                  <article className={'panel ' + styles.review} key={review.id}>
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
                    <div className="section-heading">
                      <div className="user-identity">
                        <Avatar user={review.user} />
                        <div>
                          <strong>
                            {review.user.displayName || review.user.username}
                          </strong>
                          <small className="muted">
                            {date(review.createdAt)}
                          </small>
                        </div>
                      </div>
                      <Rating value={review.rating} />
                    </div>
                    <p className={styles.comment}>
                      {review.comment || 'Avaliou este filme sem comentário.'}
                    </p>
                    <Link
                      className={'accent ' + styles.reviewLink}
                      href={'/filmes/' + review.movie.id}
                    >
                      Ver filme e avaliações →
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <State empty="A conversa começa com a primeira avaliação" />
            )}
          </section>
        </>
      )}
    </SiteShell>
  );
}
