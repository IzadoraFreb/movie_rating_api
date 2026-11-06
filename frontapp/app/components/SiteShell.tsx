'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { Avatar } from './ui';
export function SiteHeader() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  return (
    <header className="site-header">
      <nav aria-label="Navegação principal">
        <Link
          href="/"
          className={pathname === '/' ? 'active' : ''}
          aria-current={pathname === '/' ? 'page' : undefined}
        >
          Início
        </Link>
        <Link
          href="/filmes"
          className={pathname.startsWith('/filmes') ? 'active' : ''}
          aria-current={pathname.startsWith('/filmes') ? 'page' : undefined}
        >
          Filmes
        </Link>
        <Link
          href="/generos"
          className={pathname === '/generos' ? 'active' : ''}
          aria-current={pathname === '/generos' ? 'page' : undefined}
        >
          Gêneros
        </Link>
      </nav>
      <div className="account-nav">
        {loading ? (
          <span className="muted">Carregando…</span>
        ) : user ? (
          <>
            <Link
              href="/minha-area"
              className={pathname.startsWith('/minha-area') ? 'active' : ''}
            >
              Minha área
            </Link>
            <Link
              href={'/perfil/' + encodeURIComponent(user.username)}
              className={
                'account-name' +
                (pathname === '/perfil/' + user.username ? ' active' : '')
              }
              aria-label="Ver meu perfil"
              aria-current={
                pathname === '/perfil/' + user.username ? 'page' : undefined
              }
            >
              <Avatar user={user} />
              <span>{user.displayName || user.username}</span>
            </Link>
            {user.role === 'ADMIN' && <Link href="/admin">Administrar</Link>}
            <button
              className="text-button muted"
              onClick={() => {
                logout();
                router.push('/');
              }}
            >
              Sair
            </button>
          </>
        ) : (
          <Link href="/login" className="button">
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <SiteHeader />
      <main id="conteudo" className="public-main">
        {children}
      </main>
      <footer className="site-footer">
        <span>Um lugar para descobrir, assistir e registrar.</span>
        <span>Catálogo de filmes · 2026</span>
      </footer>
    </div>
  );
}
