import Image from 'next/image';
import { SiteShell } from '../components/SiteShell';

export default function CreditsPage() {
  return (
    <SiteShell>
      <section className="panel">
        <h1>Créditos</h1>

        <p>
          Projeto acadêmico de catálogo e avaliação de filmes,
          desenvolvido para fins educacionais.
        </p>

        <h2>Dados e imagens dos filmes</h2>

        <a href="https://www.themoviedb.org">
          <Image
            src="/tmdb-logo.svg"
            alt="TMDB — The Movie Database"
            width={160}
            height={60}
            style={{ objectFit: 'contain' }}
          />
        </a>

        <p>
          As informações e imagens dos filmes vinculados ao TMDB
          são fornecidas pela API do The Movie Database.
        </p>

        <p lang="en">
          This product uses the TMDB API but is not endorsed or
          certified by TMDB.
        </p>

        <h2>Avaliações da comunidade</h2>

        <p>
          As avaliações e notas da comunidade são registradas
          pelos usuários deste aplicativo e são independentes
          das notas do TMDB.
        </p>
      </section>
    </SiteShell>
  );
}