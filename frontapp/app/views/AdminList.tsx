'use client';
import Link from 'next/link';
import { useDeferredValue, useState } from 'react';
import { api, message, query } from '@/lib/api';
import { useResource } from '@/lib/use-resource';
import type { Genre, Movie, PageResult, Review, User } from '@/lib/types';
import {
  Avatar,
  Badge,
  ConfirmDialog,
  Feedback,
  Icon,
  PageTitle,
  Pagination,
  Poster,
  Rating,
  Search,
  Select,
  State,
  date,
} from '../components/ui';
type Kind = 'filmes' | 'generos' | 'usuarios' | 'avaliacoes';
const config = {
  filmes: {
    title: 'Filmes',
    singular: 'filmes',
    description:
      'Gerencie os títulos, as informações e os gêneros do catálogo.',
    search: 'Buscar por título ou direção',
    add: 'Adicionar filme',
    note: 'As notas médias são calculadas a partir das avaliações dos usuários.',
  },
  generos: {
    title: 'Gêneros',
    singular: 'gêneros',
    description: 'Organize as categorias disponíveis no catálogo.',
    search: 'Buscar por nome',
    add: 'Adicionar gênero',
    note: 'Os gêneros organizam os filmes e estão disponíveis nos filtros do catálogo público.',
  },
  usuarios: {
    title: 'Usuários',
    singular: 'usuários',
    description: '',
    search: 'Buscar por nome ou e-mail',
    add: '',
    note: 'Os dados exibidos pertencem às contas do catálogo.',
  },
  avaliacoes: {
    title: 'Avaliações',
    singular: 'avaliações',
    description:
      'Consulte as opiniões publicadas e modere conteúdos quando necessário.',
    search: 'Buscar filme ou usuário',
    add: '',
    note: 'Apenas o autor pode editar sua avaliação. A administração pode visualizar ou excluir o conteúdo.',
  },
};
export default function AdminList({ kind }: { kind: Kind }) {
  const [search, setSearch] = useState('');
  const deferred = useDeferredValue(search);
  const [filter, setFilter] = useState('');
  const [year, setYear] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const movies = useResource<PageResult<Movie>>(
    kind === 'filmes'
      ? '/movies?' + query({ q: deferred, genre: filter, year, page, limit: 6 })
      : null,
  );
  const genres = useResource<Genre[]>(
    kind === 'generos' || kind === 'filmes' ? '/genres' : null,
  );
  const years = useResource<{ years: number[] }>(
    kind === 'filmes' ? '/movies/filters' : null,
  );
  const users = useResource<User[]>(
    kind === 'usuarios' ? '/admin/users' : null,
  );
  const reviews = useResource<Review[]>(
    kind === 'avaliacoes' ? '/admin/reviews' : null,
  );
  const q = deferred.toLocaleLowerCase('pt-BR');
  const genreRows = (genres.data || []).filter((g) =>
    g.name.toLocaleLowerCase('pt-BR').includes(q),
  );
  const userRows = (users.data || []).filter(
    (u) =>
      [u.displayName, u.username, u.email]
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(q) &&
      (!filter || u.role === filter),
  );
  const reviewRows = (reviews.data || []).filter(
    (r) =>
      [r.movie.title, r.user.displayName, r.user.username]
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(q) &&
      (!filter || r.rating === Number(filter)),
  );
  const resource =
    kind === 'filmes'
      ? movies
      : kind === 'generos'
        ? genres
        : kind === 'usuarios'
          ? users
          : reviews;
  const total =
    kind === 'filmes'
      ? movies.data?.total || 0
      : kind === 'generos'
        ? genreRows.length
        : kind === 'usuarios'
          ? userRows.length
          : reviewRows.length;
  const safePage = Math.min(page, Math.max(1, Math.ceil(total / 6)));
  function subset<T>(items: T[]) {
    return items.slice((safePage - 1) * 6, safePage * 6);
  }
  function changeFilter(value: string) {
    setFilter(value);
    setPage(1);
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setError('');
    const path =
      kind === 'filmes'
        ? '/movies/'
        : kind === 'generos'
          ? '/genres/'
          : '/admin/reviews/';
    try {
      await api(path + deleting.id, { method: 'DELETE' });
      setDeleting(null);
      setPage(1);
      resource.reload();
    } catch (error) {
      setError(message(error));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  }
  const details = config[kind];
  const base = '/admin/' + kind;
  return (
    <>
      <PageTitle
        title={details.title}
        description={details.description}
        count={total + ' ' + details.singular}
        action={
          details.add && (
            <Link className="button primary" href={base + '/novo'}>
              <Icon name="plusWhite" />
              {details.add}
            </Link>
          )
        }
      />
      <Feedback error={error} />
      <div className="list-toolbar">
        <Search
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder={details.search}
        />
        <div className="inline filters">
          {kind === 'filmes' && (
            <>
              <Select
                aria-label="Filtrar por gênero"
                value={filter}
                onChange={(e) => changeFilter(e.target.value)}
              >
                <option value="">Todos os gêneros</option>
                {genres.data?.map((g) => (
                  <option value={g.id} key={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
              <Select
                aria-label="Filtrar por ano"
                value={year}
                onChange={(e) => {
                  setYear(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Todos os anos</option>
                {years.data?.years.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </Select>
            </>
          )}
          {kind === 'usuarios' && (
            <Select
              aria-label="Filtrar por perfil"
              value={filter}
              onChange={(e) => changeFilter(e.target.value)}
            >
              <option value="">Todos os perfis</option>
              <option value="USER">Usuário</option>
              <option value="ADMIN">Administrador</option>
            </Select>
          )}
          {kind === 'avaliacoes' && (
            <Select
              aria-label="Filtrar por nota"
              value={filter}
              onChange={(e) => changeFilter(e.target.value)}
            >
              <option value="">Todas as notas</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option value={n} key={n}>
                  {n} estrelas
                </option>
              ))}
            </Select>
          )}
        </div>
      </div>
      {resource.loading || resource.error ? (
        <State
          loading={resource.loading}
          error={resource.error}
          onRetry={resource.reload}
        />
      ) : (
        <>
          <div className="table-wrap">
            <table className={'admin-table table-' + kind}>
              <thead>
                <tr>
                  {(kind === 'filmes'
                    ? ['Título', 'Ano', 'Direção', 'Gêneros', 'Ações']
                    : kind === 'generos'
                      ? ['Nome', 'Filmes vinculados', 'Ações']
                      : kind === 'usuarios'
                        ? ['Nome', 'E-mail', 'Perfil', 'Ações']
                        : [
                            'Filme',
                            'Usuário',
                            'Nota',
                            'Comentário',
                            'Data',
                            'Ações',
                          ]
                  ).map((label) => (
                    <th key={label}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kind === 'filmes' &&
                  movies.data?.data.map((movie) => (
                    <tr key={movie.id}>
                      <td>
                        <Link
                          href={'/filmes/' + movie.id}
                          className="movie-identity"
                        >
                          <Poster movie={movie} slot="table" />
                          {movie.title}
                        </Link>
                      </td>
                      <td>{movie.releaseYear || '—'}</td>
                      <td>{movie.director || '—'}</td>
                      <td className="muted">
                        {movie.genres.map((g) => g.name).join(', ') || '—'}
                      </td>
                      <td>
                        <div className="row-actions">
                          <Link href={'/filmes/' + movie.id}>Visualizar</Link>
                          <Link
                            className="accent"
                            href={base + '/' + movie.id + '/editar'}
                          >
                            Editar
                          </Link>
                          <button
                            className="text-button destructive"
                            onClick={() =>
                              setDeleting({ id: movie.id, name: movie.title })
                            }
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {kind === 'generos' &&
                  subset(genreRows).map((genre) => (
                    <tr key={genre.id}>
                      <td>{genre.name}</td>
                      <td>
                        <Badge>{genre._count?.movies || 0} filmes</Badge>
                      </td>
                      <td>
                        <div className="row-actions">
                          <Link
                            className="accent"
                            href={base + '/' + genre.id + '/editar'}
                          >
                            Editar
                          </Link>
                          <button
                            className="text-button destructive"
                            onClick={() =>
                              setDeleting({ id: genre.id, name: genre.name })
                            }
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {kind === 'usuarios' &&
                  subset(userRows).map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="user-identity">
                          <Avatar user={user} />
                          <span>{user.displayName || user.username}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <Badge accent={user.role === 'ADMIN'}>
                          {user.role === 'ADMIN' ? 'Administrador' : 'Usuário'}
                        </Badge>
                      </td>
                      <td>
                        <Link
                          className="destructive"
                          href={base + '/' + user.id + '/editar'}
                        >
                          Visualizar perfil
                        </Link>
                      </td>
                    </tr>
                  ))}
                {kind === 'avaliacoes' &&
                  subset(reviewRows).map((review) => (
                    <tr key={review.id}>
                      <td>{review.movie.title}</td>
                      <td>{review.user.displayName || review.user.username}</td>
                      <td>
                        <Rating value={review.rating} />
                      </td>
                      <td className="muted">
                        <span className="comment-excerpt">
                          {review.comment || 'Sem comentário'}
                        </span>
                      </td>
                      <td>{date(review.watchedAt)}</td>
                      <td>
                        <div className="row-actions">
                          <Link href={base + '/' + review.id}>Visualizar</Link>
                          <button
                            className="text-button destructive"
                            onClick={() =>
                              setDeleting({
                                id: review.id,
                                name:
                                  'a avaliação de ' +
                                  (review.user.displayName ||
                                    review.user.username),
                              })
                            }
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!total && <State empty="Nenhum registro encontrado" />}
          </div>
          <Pagination
            page={safePage}
            total={total}
            limit={6}
            onChange={setPage}
          />
        </>
      )}
      <p className="list-note muted">{details.note}</p>
      {deleting && (
        <ConfirmDialog
          title="Excluir registro?"
          description={
            'Deseja excluir ' +
            deleting.name +
            '? Esta ação é permanente.' +
            (kind === 'filmes'
              ? ' As avaliações e os registros deste filme também serão removidos.'
              : '')
          }
          busy={busy}
          onClose={() => setDeleting(null)}
          onConfirm={() => void remove()}
        />
      )}
    </>
  );
}
