'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, message } from '@/lib/api';
import { useResource } from '@/lib/use-resource';
import type { Review } from '@/lib/types';
import {
  UserProfileLink,
  Back,
  Badge,
  ConfirmDialog,
  Feedback,
  Icon,
  PageTitle,
  Poster,
  Rating,
  State,
  date,
} from '../components/ui';
export default function AdminReview({ id }: { id: string }) {
  const review = useResource<Review>('/admin/reviews/' + id);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  async function remove() {
    setBusy(true);
    setError('');
    try {
      await api('/admin/reviews/' + id, { method: 'DELETE' });
      router.push('/admin/avaliacoes');
    } catch (error) {
      setError(message(error));
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  }
  const data = review.data;
  return (
    <>
      <Back href="/admin/avaliacoes">Voltar para avaliações</Back>
      <PageTitle
        title="Visualizar avaliação"
        description="Consulte o conteúdo completo e os dados da publicação."
      />
      <Feedback error={error} />
      {review.loading || review.error || !data ? (
        <State
          loading={review.loading}
          error={review.error}
          onRetry={review.reload}
        />
      ) : (
        <div className="form-columns">
          <article className="panel">
            <div className="section-heading">
              <div className="movie-identity moderation-movie">
                <Poster movie={data.movie} slot="moderation" />
                <div>
                  <h3>{data.movie.title}</h3>
                  <p className="muted">
                    {data.movie.releaseYear} · {data.movie.director}
                  </p>
                </div>
              </div>
              <Badge accent>Publicada</Badge>
            </div>
            <hr />
            <div className="section-heading">
              <UserProfileLink user={data.user} avatar>
                <small className="muted">{data.user.email}</small>
              </UserProfileLink>
              <div>
                <small className="muted">Data da avaliação</small>
                <p>{date(data.watchedAt)}</p>
              </div>
            </div>
            <div>
              <p className="muted detail-label">Nota do usuário</p>
              <div className="inline">
                <Rating value={data.rating} large />
                <span className="muted">de 5</span>
              </div>
            </div>
            <div>
              <p className="muted detail-label">Comentário</p>
              <p className="full-comment">
                {data.comment || 'Sem comentário.'}
              </p>
            </div>
          </article>
          <aside className="panel moderation">
            <Icon name="shield" />
            <h2>Moderação da avaliação</h2>
            <p className="muted">
              A administração pode excluir uma avaliação, mas não alterar a nota
              ou o comentário de seu autor.
            </p>
            <hr />
            <p className="destructive">
              A exclusão é permanente e atualiza a nota média do filme.
            </p>
            <button
              className="button danger full-width"
              onClick={() => setConfirm(true)}
            >
              <Icon name="trash" />
              Excluir avaliação
            </button>
          </aside>
        </div>
      )}
      {confirm && (
        <ConfirmDialog
          title="Excluir avaliação?"
          description="O comentário e a nota serão removidos permanentemente. O histórico de filmes assistidos será mantido."
          busy={busy}
          onClose={() => setConfirm(false)}
          onConfirm={() => void remove()}
        />
      )}
    </>
  );
}
