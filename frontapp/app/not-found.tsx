import Link from 'next/link';
import { SiteShell } from './components/SiteShell';
export default function NotFound() {
  return (
    <SiteShell>
      <div className="state">
        <h1>Página não encontrada</h1>
        <p>Este endereço não está disponível.</p>
        <Link className="button primary" href="/filmes">
          Voltar ao catálogo
        </Link>
      </div>
    </SiteShell>
  );
}
