'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, message } from '@/lib/api';
import { useResource } from '@/lib/use-resource';
import type { Activity, Movie } from '@/lib/types';
import { RequireAuth, useAuth } from '../components/AuthProvider';
import { SiteShell } from '../components/SiteShell';
import {
  Back,
  Badge,
  Feedback,
  Icon,
  PageTitle,
  Poster,
  State,
} from '../components/ui';
export default function ReviewForm({ id }: { id: string }) {
  return (
    <SiteShell>
      <RequireAuth>
        <ReviewContent id={id} />
      </RequireAuth>
    </SiteShell>
  );
}
function ReviewContent({ id }: { id: string }) {
  const movie = useResource<Movie>('/movies/' + id);
  const activity = useResource<Activity>('/movies/' + id + '/activity');
  if (
    movie.loading ||
    activity.loading ||
    movie.error ||
    activity.error ||
    !movie.data ||
    !activity.data
  )
    return (
      <State
        loading={movie.loading || activity.loading}
        error={movie.error || activity.error}
        onRetry={() => {
          movie.reload();
          activity.reload();
        }}
      />
    );
  return <LoadedReview movie={movie.data} activity={activity.data} />;
}
function LoadedReview({
  movie,
  activity,
}: {
  movie: Movie;
  activity: Activity;
}) {
  const [rating, setRating] = useState(activity.review?.rating || 0);
  const [comment, setComment] = useState(activity.review?.comment || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { refresh } = useAuth();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rating) {
      setError('Escolha uma nota de 1 a 5.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api('/movies/' + movie.id + '/review', {
        method: 'PUT',
        body: JSON.stringify({ rating, comment }),
      });
      await refresh();
      router.push('/minha-area');
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Back href="/minha-area">Voltar para minha área</Back>
      <PageTitle
        title={activity.review ? 'Editar minha avaliação' : 'Avaliar filme'}
        description="Compartilhe sua experiência. Sua nota ajuda outras pessoas a descobrir novos filmes."
      />
      <div className="form-columns public-form-columns">
        <form className="panel form-panel" onSubmit={submit}>
          <h2>Minha avaliação</h2>
          <Feedback error={error} />
          <fieldset className="rating-fieldset">
            <legend>Nota *</legend>
            <div className="rating-options">
              {[1, 2, 3, 4, 5].map((n) => (
                <label
                  className={
                    'rating-option' + (rating === n ? ' selected' : '')
                  }
                  key={n}
                >
                  <input
                    type="radio"
                    name="rating"
                    value={n}
                    checked={rating === n}
                    onChange={() => setRating(n)}
                    required
                  />
                  <Icon name="starLarge" />
                  {n}
                </label>
              ))}
              <span className="muted">
                {rating ? rating + ' de 5 estrelas' : 'Selecione uma nota'}
              </span>
            </div>
          </fieldset>
          <label className="field">
            Comentário
            <textarea
              aria-label="Comentário"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={2000}
              rows={7}
              placeholder="O que você achou do filme?"
            />
            <small className="muted">{comment.length}/2000 caracteres</small>
          </label>
          <small className="muted">
            Sua avaliação será publicada no catálogo.
          </small>
          <div className="form-actions">
            <button className="button primary" disabled={busy}>
              {busy ? 'Salvando…' : 'Salvar'}
            </button>
            <Link className="button" href="/minha-area">
              Cancelar
            </Link>
          </div>
        </form>
        <aside className="panel movie-summary">
          <h2>Filme avaliado</h2>
          <div className="summary-poster">
            <Poster movie={movie} slot="detail" />
          </div>
          <div>
            <h3>{movie.title}</h3>
            <p className="muted">
              {movie.releaseYear} · {movie.director}
            </p>
            <div className="badges">
              {movie.genres.map((g) => (
                <Badge key={g.id}>{g.name}</Badge>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
