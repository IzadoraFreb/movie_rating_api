'use client';
/* Os SVGs do protótipo são mantidos localmente, com suas dimensões originais. */
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import type { Movie, User } from '@/lib/types';

const icons = {
  search: '3de46',
  down: '8133a',
  back: '5b0ef',
  eye: '2a828',
  star: '0e986',
  starLarge: '02765',
  starWhite: '63522',
  check: '18c65',
  plus: 'c3794',
  plusWhite: '2fd53',
  dashboard: '8fa7d',
  dashboardActive: '323b4',
  movies: '11eee',
  moviesActive: '72c75',
  genres: 'a1341',
  genresActive: '29dce',
  users: 'de994',
  usersActive: '6ef35',
  reviews: 'fad2f',
  reviewsActive: '453ca',
  logout: '2451f',
  right: '2af54',
  external: 'd451d',
  info: '05e06',
  shield: '97370',
  trash: '71db7',
};
export function Icon({ name }: { name: keyof typeof icons }) {
  return (
    <img
      className="icon"
      src={'/figma/' + icons[name] + '.svg'}
      alt=""
      aria-hidden="true"
    />
  );
}
export function Avatar({
  user,
  large = false,
}: {
  user: Pick<User, 'username' | 'displayName'>;
  large?: boolean;
}) {
  const name = user.displayName || user.username;
  return (
    <span
      className={'avatar' + (large ? ' avatar-large' : '')}
      aria-hidden="true"
    >
      {name
        .split(/\s+/)
        .map((s) => s[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()}
    </span>
  );
}
export function Badge({
  children,
  accent = false,
}: {
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <span className={'badge' + (accent ? ' badge-accent' : '')}>
      {children}
    </span>
  );
}
export function Rating({
  value,
  large = false,
}: {
  value: number | null | undefined;
  large?: boolean;
}) {
  return value == null ? (
    <span className="muted">Sem avaliações</span>
  ) : (
    <span className="rating">
      <Icon name={large ? 'starLarge' : 'star'} />
      {value.toFixed(1).replace('.', ',')}
    </span>
  );
}
export function Back({
  href = '/filmes',
  children = 'Voltar ao catálogo',
}: {
  href?: string;
  children?: ReactNode;
}) {
  return (
    <Link className="back" href={href}>
      <Icon name="back" />
      {children}
    </Link>
  );
}
export function PageTitle({
  title,
  description,
  count,
  action,
}: {
  title: string;
  description?: string;
  count?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <div className="title-row">
          <h1>{title}</h1>
          {count && <Badge>{count}</Badge>}
        </div>
        {description !== undefined && <p className="muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Select({
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="select-wrap">
      <select {...props}>{children}</select>
      <Icon name="down" />
    </div>
  );
}
export function Search({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="search">
      <Icon name="search" />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type="search"
      />
    </div>
  );
}
export function Feedback({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  if (error)
    return (
      <div className="feedback error" role="alert">
        {error}
      </div>
    );
  if (success)
    return (
      <div className="feedback success" role="status">
        {success}
      </div>
    );
  return null;
}
export function State({
  loading,
  error,
  empty,
  onRetry,
}: {
  loading?: boolean;
  error?: string;
  empty?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="state">
      {loading ? (
        <p role="status">Carregando…</p>
      ) : error ? (
        <>
          <p role="alert">{error}</p>
          {onRetry && (
            <button className="button" onClick={onRetry}>
              Tentar novamente
            </button>
          )}
        </>
      ) : (
        <>
          <h3>{empty || 'Nenhum resultado encontrado'}</h3>
          <p className="muted">Explore o catálogo ou ajuste os filtros.</p>
        </>
      )}
    </div>
  );
}
export function Pagination({
  page,
  total,
  limit,
  onChange,
}: {
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  const visible = Array.from(
    new Set([
      1,
      ...Array.from({ length: 5 }, (_, i) => page + i - 2).filter(
        (n) => n > 1 && n < pages,
      ),
      pages,
    ]),
  ).sort((a, b) => a - b);
  return (
    <div className="pagination">
      <span>
        Mostrando {total ? (page - 1) * limit + 1 : 0}–
        {Math.min(page * limit, total)} de {total} registros
      </span>
      <nav aria-label="Paginação">
        <button disabled={page === 1} onClick={() => onChange(page - 1)}>
          Anterior
        </button>
        {visible.map((n, i) => (
          <span key={n}>
            {i > 0 && n - visible[i - 1] > 1 && (
              <span className="page-ellipsis">…</span>
            )}
            <button
              className={page === n ? 'current' : 'page-number'}
              aria-current={page === n ? 'page' : undefined}
              onClick={() => onChange(n)}
            >
              {n}
            </button>
          </span>
        ))}
        <button disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Próxima
        </button>
      </nav>
    </div>
  );
}
export function ConfirmDialog({
  title,
  description,
  busy,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    const current = ref.current;
    return () => current?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby="confirm-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <h2 id="confirm-title">{title}</h2>
      <p className="muted">{description}</p>
      <div className="form-actions">
        <button className="button" disabled={busy} onClick={onClose}>
          Cancelar
        </button>
        <button className="button danger" disabled={busy} onClick={onConfirm}>
          {busy ? 'Excluindo…' : 'Confirmar exclusão'}
        </button>
      </div>
    </dialog>
  );
}
export function date(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

const titles = [
  'Entre marés',
  'A última estação',
  'Órbita silenciosa',
  'Dias de setembro',
  'O jardim de vidro',
  'Quase domingo',
  'Pequenos planetas',
  'Cartas do norte',
  'Depois da chuva',
  'A casa do vento',
  'Horizonte comum',
  'Cidade em pausa',
];
const circles = ['a40fc', '03bb2', '5e1a7', '447f7', '19756', 'a40fc'];
const thumbs = ['c9b11', '1dba2', '2d472', '2c872', 'fc4ca', '53f11'];
export function Poster({
  movie,
  slot = 'catalog',
}: {
  movie: Movie;
  slot?:
    'catalog' | 'detail' | 'table' | 'history' | 'watchlist' | 'moderation';
}) {
  const index = titles.indexOf(movie.title);
  const palette = index < 0 ? 0 : index % 6;
  const dynamic = movie.posterUrl;
  const [failed, setFailed] = useImageFailure(dynamic);
  if (dynamic && !failed)
    return (
      <img
        className={'poster-image poster-image-' + slot}
        src={dynamic}
        alt={'Pôster de ' + movie.title}
        onError={setFailed}
      />
    );
  let asset: string | undefined;
  if (index >= 0) {
    if (slot === 'table') asset = thumbs[palette];
    if (slot === 'history')
      asset = (
        { 0: 'd6e92', 1: '1ac19', 3: '999b1' } as Record<number, string>
      )[index];
    if (slot === 'watchlist')
      asset = ({ 2: 'd97c4', 4: 'e5185' } as Record<number, string>)[index];
    if (slot === 'moderation' && index === 0) asset = '86cea';
  }
  if (asset)
    return (
      <img
        className="poster-static"
        src={'/figma/' + asset + '.svg'}
        alt={'Pôster de ' + movie.title}
      />
    );
  return (
    <div
      role="img"
      aria-label={'Pôster de ' + movie.title}
      className={'poster poster-' + slot + ' palette-' + palette}
    >
      <img
        className="poster-circle"
        src={
          '/figma/' +
          (slot === 'detail' && palette === 0 ? '5cdb1' : circles[palette]) +
          '.svg'
        }
        alt=""
      />
      <span className="poster-band" />
      {(slot === 'catalog' || slot === 'detail') && (
        <>
          <span className="poster-credit">
            UM FILME DE{' '}
            {(movie.director || 'DIREÇÃO NÃO INFORMADA').toUpperCase()}
          </span>
          <span className="poster-title">
            <strong>{movie.title}</strong>
            <small>{movie.releaseYear}</small>
          </span>
        </>
      )}
    </div>
  );
}
function useImageFailure(src: string | null) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return [Boolean(src && failedSrc === src), () => setFailedSrc(src)] as const;
}
export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link href={'/filmes/' + movie.id} className="movie-card">
      <Poster movie={movie} />
      <h3>{movie.title}</h3>
      <div className="movie-meta">
        <span>{movie.releaseYear || 'Ano não informado'}</span>
        <Rating value={movie.averageRating} />
      </div>
    </Link>
  );
}
