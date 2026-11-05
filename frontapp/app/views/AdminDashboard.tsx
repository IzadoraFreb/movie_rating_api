'use client';
import Link from 'next/link';
import { useResource } from '@/lib/use-resource';
import type { Dashboard } from '@/lib/types';
import { Icon, PageTitle, Rating, State, date } from '../components/ui';
export default function AdminDashboard() {
  const resource = useResource<Dashboard>('/admin/dashboard');
  if (resource.loading || resource.error || !resource.data)
    return (
      <State
        loading={resource.loading}
        error={resource.error}
        onRetry={resource.reload}
      />
    );
  const data = resource.data;
  const stats = [
    {
      label: 'Filmes',
      count: data.movies,
      note: 'Títulos no catálogo',
      icon: 'moviesActive' as const,
      href: '/admin/filmes',
    },
    {
      label: 'Gêneros',
      count: data.genres,
      note: 'Categorias disponíveis',
      icon: 'genresActive' as const,
      href: '/admin/generos',
    },
    {
      label: 'Usuários',
      count: data.users,
      note: 'Contas cadastradas',
      icon: 'usersActive' as const,
      href: '/admin/usuarios',
    },
    {
      label: 'Avaliações',
      count: data.reviews,
      note: 'Opiniões publicadas',
      icon: 'reviewsActive' as const,
      href: '/admin/avaliacoes',
    },
  ];
  const maximum = Math.max(
    ...data.distribution.map((g) => g._count?.movies || 0),
    1,
  );
  return (
    <>
      <PageTitle
        title="Visão geral"
        description="Acompanhe o catálogo e as contribuições da comunidade."
      />
      <div className="stat-grid">
        {stats.map((stat) => (
          <Link className="panel stat-card" href={stat.href} key={stat.label}>
            <div className="section-heading">
              <span className="muted">{stat.label}</span>
              <Icon name={stat.icon} />
            </div>
            <strong>{stat.count}</strong>
            <small className="muted">{stat.note}</small>
          </Link>
        ))}
      </div>
      <div className="dashboard-columns">
        <section className="panel">
          <div>
            <h2>Avaliações recentes</h2>
            <p className="muted">
              Últimas contribuições publicadas no catálogo.
            </p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Filme</th>
                  <th>Usuário</th>
                  <th>Nota</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((review) => (
                  <tr key={review.id}>
                    <td>
                      <Link href={'/admin/avaliacoes/' + review.id}>
                        {review.movie.title}
                      </Link>
                    </td>
                    <td>{review.user.displayName || review.user.username}</td>
                    <td>
                      <Rating value={review.rating} />
                    </td>
                    <td>{date(review.watchedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.recent.length && <State empty="Ainda não há avaliações" />}
          </div>
          <Link className="accent" href="/admin/avaliacoes">
            Ver todas as avaliações →
          </Link>
        </section>
        <section className="panel">
          <div>
            <h2>Filmes por gênero</h2>
            <p className="muted">Um filme pode ter mais de um gênero.</p>
          </div>
          <div className="distribution">
            {data.distribution.map((genre) => (
              <div key={genre.id}>
                <div className="section-heading">
                  <span>{genre.name}</span>
                  <span className="muted">{genre._count?.movies || 0}</span>
                </div>
                <div className="bar-track">
                  <div
                    style={{
                      width: ((genre._count?.movies || 0) / maximum) * 88 + '%',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
