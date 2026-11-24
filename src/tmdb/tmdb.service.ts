import {
  BadGatewayException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface TmdbMovieDetails {
  id: number;
  title: string;
  overview: string;
  release_date?: string;
  runtime: number | null;
  poster_path: string | null;
  genres: {
    id: number;
    name: string;
  }[];
  credits: {
    crew: {
      id: number;
      name: string;
      job: string;
    }[];
  };
}

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
    constructor(private readonly prisma: PrismaService) {}
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
  async getMovieDetails(tmdbId: number) {
  const token = process.env.TMDB_READ_ACCESS_TOKEN?.trim();

  if (!token) {
    throw new ServiceUnavailableException(
      'O token do TMDB não está configurado no backend.',
    );
  }

  const url = new URL(
    `https://api.themoviedb.org/3/movie/${tmdbId}`,
  );

  url.searchParams.set('language', 'pt-BR');
  url.searchParams.set('append_to_response', 'credits');

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

  if (response.status === 404) {
    throw new NotFoundException(
      'Filme não encontrado no TMDB.',
    );
  }

  if (!response.ok) {
    throw new BadGatewayException(
      'O TMDB não conseguiu atender à consulta.',
    );
  }

  let movie: TmdbMovieDetails;

  try {
    movie = (await response.json()) as TmdbMovieDetails;
  } catch {
    throw new BadGatewayException(
      'O TMDB retornou uma resposta inválida.',
    );
  }

  const directors = movie.credits.crew
    .filter((person) => person.job === 'Director')
    .map((person) => person.name);

  return {
    tmdbId: movie.id,
    title: movie.title,
    synopsis: movie.overview || null,
    releaseYear: movie.release_date
      ? Number(movie.release_date.slice(0, 4))
      : null,
    duration: movie.runtime,
    director: directors.join(', ') || null,
    posterPath: movie.poster_path,
    genres: movie.genres.map((genre) => ({
      tmdbId: genre.id,
      name: genre.name,
    })),
  };
  
}
async importMovie(tmdbId: number) {
  const existing = await this.prisma.movie.findUnique({
    where: { tmdbId },
    include: { genres: true },
  });

  if (existing) {
    return existing;
  }

  const details = await this.getMovieDetails(tmdbId);

  return this.prisma.$transaction(async (transaction) => {
    const genres: { id: string }[] = [];

    for (const genre of details.genres) {
      const savedGenre = await transaction.genre.upsert({
        where: { name: genre.name },
        create: { name: genre.name },
        update: {},
      });

      genres.push({ id: savedGenre.id });
    }

    return transaction.movie.upsert({
      where: { tmdbId },
      create: {
        tmdbId: details.tmdbId,
        tmdbUpdatedAt: new Date(),
        title: details.title,
        releaseYear: details.releaseYear,
        synopsis: details.synopsis,
        duration: details.duration,
        director: details.director,
        posterUrl: details.posterPath
          ? `https://image.tmdb.org/t/p/w500${details.posterPath}`
          : null,
        genres: {
          connect: genres,
        },
      },
      update: {},
      include: { genres: true },
    });
  });
}
async linkMovie(movieId: string, tmdbId: number) {
  const movie = await this.prisma.movie.findUnique({
    where: { id: movieId },
  });

  if (!movie) {
    throw new NotFoundException('Filme local não encontrado.');
  }

  const details = await this.getMovieDetails(tmdbId);

  return this.prisma.$transaction(async (transaction) => {
    const current = await transaction.movie.findUnique({
      where: { id: movieId },
    });

    if (!current) {
      throw new NotFoundException('Filme local não encontrado.');
    }

    if (current.tmdbId !== null && current.tmdbId !== tmdbId) {
      throw new ConflictException(
        'Este filme já está vinculado a outro filme do TMDB.',
      );
    }

    const linked = await transaction.movie.findUnique({
      where: { tmdbId },
    });

    if (linked && linked.id !== movieId) {
      throw new ConflictException(
        `Este filme do TMDB já está vinculado ao registro ${linked.id}. ` +
        'É necessário revisar os dois registros antes de unir os dados.',
      );
    }

    const genres: { id: string }[] = [];

    for (const genre of details.genres) {
      const savedGenre = await transaction.genre.upsert({
        where: { name: genre.name },
        create: { name: genre.name },
        update: {},
      });

      genres.push({ id: savedGenre.id });
    }

    return transaction.movie.update({
      where: { id: movieId },
      data: {
        tmdbId,
        tmdbUpdatedAt: new Date(),
        title: details.title,
        releaseYear: details.releaseYear,
        director: details.director,
        synopsis: details.synopsis,
        duration: details.duration,
        posterUrl: details.posterPath
          ? `https://image.tmdb.org/t/p/w500${details.posterPath}`
          : current.posterUrl,
        genres: {
          set: genres,
        },
      },
      include: { genres: true },
    });
  });
}

async mergeMovie(movieId: string, tmdbId: number) {
  return this.prisma.$transaction(async (transaction) => {
    const original = await transaction.movie.findUnique({
      where: { id: movieId },
    });

    if (!original) {
      throw new NotFoundException('Filme antigo não encontrado.');
    }

    if (
      original.tmdbId !== null &&
      original.tmdbId !== tmdbId
    ) {
      throw new ConflictException(
        'O filme antigo já está vinculado a outro filme do TMDB.',
      );
    }

    const imported = await transaction.movie.findUnique({
      where: { tmdbId },
      include: {
        genres: true,
        watchlistedBy: true,
        watchedBy: true,
        _count: {
          select: { reviews: true },
        },
      },
    });

    if (!imported) {
      throw new NotFoundException('Filme importado não encontrado.');
    }

    // Se já foi unido, apenas devolve o registro existente.
    if (imported.id === original.id) {
      return transaction.movie.findUniqueOrThrow({
        where: { id: original.id },
        include: { genres: true },
      });
    }

    // Não remove uma duplicata que passou a ter avaliações.
    if (imported._count.reviews > 0) {
      throw new ConflictException(
        'O filme importado possui avaliações. ' +
        'É necessário revisar essas avaliações antes de unir.',
      );
    }

    // Transfere a watchlist, preservando entradas do filme antigo.
    for (const item of imported.watchlistedBy) {
      await transaction.watchlistItem.upsert({
        where: {
          userId_movieId: {
            userId: item.userId,
            movieId: original.id,
          },
        },
        create: {
          userId: item.userId,
          movieId: original.id,
          addedAt: item.addedAt,
        },
        update: {},
      });
    }

    // Transfere os registros de assistido.
    for (const item of imported.watchedBy) {
      await transaction.watchedMovie.upsert({
        where: {
          userId_movieId: {
            userId: item.userId,
            movieId: original.id,
          },
        },
        create: {
          userId: item.userId,
          movieId: original.id,
          watchedAt: item.watchedAt,
        },
        update: {},
      });
    }

    // Libera o identificador único antes de associá-lo ao antigo.
    await transaction.movie.update({
      where: { id: imported.id },
      data: { tmdbId: null },
    });

    const merged = await transaction.movie.update({
      where: { id: original.id },
      data: {
        tmdbId,
        tmdbUpdatedAt: imported.tmdbUpdatedAt,
        title: imported.title,
        releaseYear: imported.releaseYear ?? original.releaseYear,
        director: imported.director ?? original.director,
        synopsis: imported.synopsis ?? original.synopsis,
        duration: imported.duration ?? original.duration,
        posterUrl: imported.posterUrl ?? original.posterUrl,
        genres: {
          set: imported.genres.map((genre) => ({
            id: genre.id,
          })),
        },
      },
      include: { genres: true },
    });

    // As relações já foram transferidas; remove a duplicata.
    await transaction.movie.delete({
      where: { id: imported.id },
    });

    return merged;
  });
}
}