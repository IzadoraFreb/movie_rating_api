import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  release_date?: string;
  poster_path: string | null;
}

interface TmdbSearchResponse {
  page: number;
  total_pages: number;
  total_results: number;
  results: TmdbMovie[];
}

@Injectable()
export class TmdbService {
  async searchMovies(query: string, page: number) {
    const token = process.env.TMDB_READ_ACCESS_TOKEN?.trim();

    if (!token) {
      throw new ServiceUnavailableException(
        'O token do TMDB não está configurado no backend.',
      );
    }

    const url = new URL(
      'https://api.themoviedb.org/3/search/movie',
    );

    url.searchParams.set('query', query);
    url.searchParams.set('language', 'pt-BR');
    url.searchParams.set('page', String(page));
    url.searchParams.set('include_adult', 'false');

    let response: Response;

    try {
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Não foi possível conectar ao TMDB. Tente novamente.',
      );
    }

    if (!response.ok) {
      throw new BadGatewayException(
        'O TMDB não conseguiu atender à consulta.',
      );
    }

    let data: TmdbSearchResponse;

    try {
      data = (await response.json()) as TmdbSearchResponse;
    } catch {
      throw new BadGatewayException(
        'O TMDB retornou uma resposta inválida.',
      );
    }

    return {
      page: data.page,
      totalPages: data.total_pages,
      total: data.total_results,
      data: data.results.map((movie) => ({
        tmdbId: movie.id,
        title: movie.title,
        synopsis: movie.overview || null,
        releaseYear: movie.release_date
          ? Number(movie.release_date.slice(0, 4))
          : null,
        posterPath: movie.poster_path,
      })),
    };
  }
}