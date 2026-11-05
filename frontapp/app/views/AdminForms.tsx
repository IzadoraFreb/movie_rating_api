'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api, message } from '@/lib/api';
import { useResource } from '@/lib/use-resource';
import type { Genre, Movie, User } from '@/lib/types';
import {
  Avatar,
  Back,
  Badge,
  Feedback,
  Icon,
  PageTitle,
  Poster,
  Select,
  State,
} from '../components/ui';
import { useAuth } from '../components/AuthProvider';
export function GenreForm({ id }: { id?: string }) {
  const genres = useResource<Genre[]>(id ? '/genres' : null);
  if (id && (genres.loading || genres.error))
    return (
      <State
        loading={genres.loading}
        error={genres.error}
        onRetry={genres.reload}
      />
    );
  const genre = genres.data?.find((g) => g.id === id);
  if (id && !genre) return <State error="Gênero não encontrado" />;
  return <LoadedGenre key={id || 'new'} genre={genre} />;
}
function LoadedGenre({ genre }: { genre?: Genre }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = String(new FormData(event.currentTarget).get('name')).trim();
    setBusy(true);
    setError('');
    try {
      await api('/genres' + (genre ? '/' + genre.id : ''), {
        method: genre ? 'PATCH' : 'POST',
        body: JSON.stringify({ name }),
      });
      router.push('/admin/generos');
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Back href="/admin/generos">Voltar para gêneros</Back>
      <PageTitle
        title={genre ? 'Editar gênero' : 'Adicionar gênero'}
        description="Crie uma categoria para organizar os filmes. O campo com * é obrigatório."
      />
      <div className="form-columns">
        <form className="panel form-panel" onSubmit={submit}>
          <h2>Dados do gênero</h2>
          <Feedback error={error} />
          <label className="field">
            Nome *
            <input
              name="name"
              aria-label="Nome *"
              defaultValue={genre?.name}
              placeholder="Ex.: Musical"
              required
              maxLength={60}
            />
            <small className="muted">
              Use um nome curto e não repita um gênero já cadastrado.
            </small>
          </label>
          <FormActions busy={busy} href="/admin/generos" />
        </form>
        <aside className="form-hint">
          <Icon name="info" />
          <h2>Organização do catálogo</h2>
          <p className="muted">
            Depois de salvo, o gênero estará disponível no formulário de filme e
            nos filtros do catálogo público.
          </p>
        </aside>
      </div>
    </>
  );
}
function FormActions({ busy, href }: { busy: boolean; href: string }) {
  return (
    <div className="form-actions">
      <button className="button primary" disabled={busy}>
        {busy ? 'Salvando…' : 'Salvar'}
      </button>
      <Link className="button" href={href}>
        Cancelar
      </Link>
    </div>
  );
}
export function UserForm({ id }: { id: string }) {
  const user = useResource<User>('/admin/users/' + id);
  return user.loading || user.error || !user.data ? (
    <State loading={user.loading} error={user.error} onRetry={user.reload} />
  ) : (
    <LoadedUser user={user.data} />
  );
}
function LoadedUser({ user }: { user: User }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      const password = String(data.get('password'));
      await api('/admin/users/' + user.id, {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: String(data.get('displayName')).trim(),
          email: String(data.get('email')).trim(),
          role: data.get('role'),
          ...(password ? { password } : {}),
        }),
      });
      if (user.id === auth.user?.id) await auth.refresh();
      router.push('/admin/usuarios');
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Back href="/admin/usuarios">Voltar para usuários</Back>
      <PageTitle
        title="Editar usuário"
        description={
          'Atualize os dados de ' +
          (user.displayName || user.username) +
          '. Os campos com * são obrigatórios.'
        }
      />
      <div className="form-columns">
        <form className="panel form-panel" onSubmit={submit}>
          <h2>Dados da conta</h2>
          <Feedback error={error} />
          <label className="field">
            Nome *
            <input
              name="displayName"
              defaultValue={user.displayName || user.username}
              required
              minLength={2}
              maxLength={80}
            />
          </label>
          <label className="field">
            E-mail *
            <input
              name="email"
              type="email"
              defaultValue={user.email}
              required
              maxLength={254}
            />
          </label>
          <label className="field">
            Perfil *
            <Select name="role" defaultValue={user.role} required>
              <option value="USER">Usuário</option>
              <option value="ADMIN">Administrador</option>
            </Select>
          </label>
          <label className="field">
            Senha
            <span className="password-input">
              <input
                name="password"
                aria-label="Senha"
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Defina uma nova senha"
                minLength={8}
                maxLength={128}
              />
              <button
                type="button"
                aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
                onClick={() => setShow(!show)}
              >
                <Icon name="eye" />
              </button>
            </span>
            <small className="muted">
              Deixe em branco para manter a senha atual. Mínimo de 8 caracteres.
            </small>
          </label>
          <FormActions busy={busy} href="/admin/usuarios" />
        </form>
        <aside className="panel">
          <h2>Resumo do usuário</h2>
          <div className="user-identity">
            <Avatar user={user} />
            <div>
              <strong>{user.displayName || user.username}</strong>
              <div>
                <Badge>
                  {user.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
                </Badge>
              </div>
            </div>
          </div>
          <hr />
          <div className="section-heading">
            <span className="muted">Filmes assistidos</span>
            <strong>{user._count?.watched || 0}</strong>
          </div>
          <div className="section-heading">
            <span className="muted">Avaliações publicadas</span>
            <strong>{user._count?.reviews || 0}</strong>
          </div>
        </aside>
      </div>
    </>
  );
}
export function MovieForm({ id }: { id?: string }) {
  const movie = useResource<Movie>(id ? '/movies/' + id : null);
  const genres = useResource<Genre[]>('/genres');
  if (movie.loading || genres.loading || movie.error || genres.error)
    return (
      <State
        loading={movie.loading || genres.loading}
        error={movie.error || genres.error}
        onRetry={() => {
          movie.reload();
          genres.reload();
        }}
      />
    );
  return (
    <LoadedMovie
      key={id || 'new'}
      movie={movie.data}
      genres={genres.data || []}
    />
  );
}
function LoadedMovie({ movie, genres }: { movie?: Movie; genres: Genre[] }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Movie>(
    movie || {
      id: '',
      title: 'Título do filme',
      releaseYear: new Date().getFullYear(),
      duration: null,
      director: '',
      synopsis: '',
      posterUrl: null,
      genres: [],
      averageRating: null,
      ratingCount: 0,
    },
  );
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = {
      title: String(data.get('title')).trim(),
      releaseYear: Number(data.get('releaseYear')),
      duration: Number(data.get('duration')),
      director: String(data.get('director')).trim(),
      synopsis: String(data.get('synopsis')).trim(),
      genreIds: data.getAll('genreIds'),
      posterUrl: String(data.get('posterUrl') || '').trim() || null,
    };
    setBusy(true);
    setError('');
    try {
      await api('/movies' + (movie ? '/' + movie.id : ''), {
        method: movie ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      });
      router.push('/admin/filmes');
    } catch (error) {
      setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Back href="/admin/filmes">Voltar para filmes</Back>
      <PageTitle
        title={movie ? 'Editar filme' : 'Adicionar filme'}
        description="Preencha as informações do título. Os campos com * são obrigatórios."
      />
      <div className="form-columns">
        <form className="panel form-panel" onSubmit={submit}>
          <h2>Dados do filme</h2>
          <Feedback error={error} />
          <label className="field">
            Título *
            <input
              name="title"
              required
              maxLength={200}
              defaultValue={movie?.title}
              placeholder="Ex.: Entre marés"
              onChange={(e) =>
                setPreview({
                  ...preview,
                  title: e.target.value || 'Título do filme',
                })
              }
            />
          </label>
          <div className="field-grid">
            <label className="field">
              Ano de lançamento *
              <input
                name="releaseYear"
                type="number"
                required
                min={1888}
                max={new Date().getFullYear() + 10}
                defaultValue={movie?.releaseYear || ''}
                placeholder="2026"
                onChange={(e) =>
                  setPreview({
                    ...preview,
                    releaseYear: Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="field">
              Duração (minutos) *
              <input
                name="duration"
                type="number"
                required
                min={1}
                max={1440}
                defaultValue={movie?.duration || ''}
                placeholder="108"
              />
            </label>
          </div>
          <label className="field">
            Direção *
            <input
              name="director"
              required
              maxLength={120}
              defaultValue={movie?.director || ''}
              placeholder="Nome de quem dirige"
              onChange={(e) =>
                setPreview({ ...preview, director: e.target.value })
              }
            />
          </label>
          <label className="field">
            Sinopse *
            <textarea
              name="synopsis"
              required
              maxLength={5000}
              rows={5}
              defaultValue={movie?.synopsis || ''}
              placeholder="Uma breve apresentação da história…"
            />
          </label>
          <label className="field">
            URL do pôster
            <input
              name="posterUrl"
              type="url"
              defaultValue={movie?.posterUrl || ''}
              placeholder="https://exemplo.com/poster.jpg"
              onChange={(e) =>
                setPreview({ ...preview, posterUrl: e.target.value || null })
              }
            />
            <small className="muted">
              Informe uma URL pública de imagem ou use a arte padrão.
            </small>
          </label>
          <fieldset className="genre-fieldset">
            <legend>Gêneros</legend>
            {genres.length ? (
              <div className="genre-checkboxes">
                {genres.map((g) => (
                  <label key={g.id}>
                    <input
                      type="checkbox"
                      name="genreIds"
                      value={g.id}
                      defaultChecked={movie?.genres.some(
                        (genre) => genre.id === g.id,
                      )}
                    />
                    {g.name}
                  </label>
                ))}
              </div>
            ) : (
              <p className="muted">
                Cadastre um gênero para vinculá-lo ao filme.
              </p>
            )}
          </fieldset>
          <FormActions busy={busy} href="/admin/filmes" />
        </form>
        <aside className="panel movie-summary">
          <h2>Prévia do pôster</h2>
          <div className="summary-poster">
            <Poster movie={preview} slot="detail" />
          </div>
          <p className="muted">
            A prévia acompanha as informações do formulário.
          </p>
        </aside>
      </div>
    </>
  );
}
