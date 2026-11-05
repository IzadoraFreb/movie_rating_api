'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { RequireAuth, useAuth } from './AuthProvider';
import { Avatar, Icon } from './ui';
const pages = [
  {
    path: '/admin',
    label: 'Dashboard',
    icon: 'dashboard' as const,
    active: 'dashboardActive' as const,
  },
  {
    path: '/admin/filmes',
    label: 'Filmes',
    icon: 'movies' as const,
    active: 'moviesActive' as const,
  },
  {
    path: '/admin/generos',
    label: 'Gêneros',
    icon: 'genres' as const,
    active: 'genresActive' as const,
  },
  {
    path: '/admin/usuarios',
    label: 'Usuários',
    icon: 'users' as const,
    active: 'usersActive' as const,
  },
  {
    path: '/admin/avaliacoes',
    label: 'Avaliações',
    icon: 'reviews' as const,
    active: 'reviewsActive' as const,
  },
];
export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth admin>
      <AdminContent>{children}</AdminContent>
    </RequireAuth>
  );
}
function AdminContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const current =
    pages.find((page) => page.path === pathname) ||
    pages.slice(1).find((page) => pathname.startsWith(page.path)) ||
    pages[0];
  return (
    <div className="admin-shell">
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <aside className="admin-sidebar">
        <div>
          <Link href="/admin" className="admin-brand">
            <strong>Administração</strong>
            <small className="muted">Gestão do catálogo</small>
          </Link>
          <nav aria-label="Administração">
            {pages.map((page) => (
              <Link
                key={page.path}
                href={page.path}
                className={current.path === page.path ? 'active' : ''}
                aria-current={current.path === page.path ? 'page' : undefined}
              >
                <Icon
                  name={current.path === page.path ? page.active : page.icon}
                />
                <span>{page.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="admin-session">
          <hr />
          <div className="user-identity">
            <Avatar user={user!} />
            <div>
              <strong>{user!.displayName || user!.username}</strong>
              <small className="muted">Administrador</small>
            </div>
          </div>
          <button
            className="text-button muted logout"
            onClick={() => {
              logout();
              router.push('/');
            }}
          >
            <Icon name="logout" />
            Sair
          </button>
        </div>
      </aside>
      <div className="admin-workspace">
        <header
          className={
            'admin-context' +
            (pathname === '/admin/usuarios' ? ' context-empty' : '')
          }
        >
          <div className="inline">
            <span className="muted">Administração</span>
            <Icon name="right" />
            <span>{current.label}</span>
          </div>
          <Link className="back" href="/">
            Ver catálogo público
            <Icon name="external" />
          </Link>
        </header>
        <main id="conteudo" className="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
