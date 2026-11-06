import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovieDto, CreateReviewDto } from './movie.dto';
import type { Prisma } from '../generated/prisma/client';

@Injectable()
export class MoviesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    search: string | undefined,
    page: number,
    limit: number,
    genre?: string,
    year?: string,
    rating?: string,
  ) {
    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safeLimit = Number.isInteger(limit)
      ? Math.min(Math.max(limit, 1), 50)
      : 20;
    const where: Prisma.MovieWhereInput = {
      ...(search
        ? {
            OR: [
              { title: { contains: search } },
              { director: { contains: search } },
            ],
          }
        : {}),
      ...(genre ? { genres: { some: { id: genre } } } : {}),
      ...(year && Number.isInteger(Number(year))
        ? { releaseYear: Number(year) }
        : {}),
    };
    if (rating === 'unrated') where.reviews = { none: {} };
    else if (rating) {
      const value = Number(rating);
      if (!Number.isInteger(value) || value < 1 || value > 5)
        throw new BadRequestException('Nota de filtro inválida');
      const rated = await this.prisma.review.groupBy({
        by: ['movieId'],
        where: { movie: where },
        having: { rating: { _avg: { gte: value, lt: value + 1 } } },
      });
      where.id = { in: rated.map((review) => review.movieId) };
    }
    const [movies, total] = await Promise.all([
      this.prisma.movie.findMany({
        where,
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        include: { genres: true },
      }),
      this.prisma.movie.count({ where }),
    ]);
    const scores = await this.prisma.review.groupBy({
      by: ['movieId'],
      where: { movieId: { in: movies.map((movie) => movie.id) } },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const scoreByMovie = new Map(scores.map((score) => [score.movieId, score]));
    const data = movies.map((movie) => ({
      ...movie,
      averageRating: scoreByMovie.get(movie.id)?._avg.rating ?? null,
      ratingCount: scoreByMovie.get(movie.id)?._count.rating ?? 0,
    }));
    return {
      page: safePage,
      limit: safeLimit,
      total,
      data,
    };
  }

  async filters() {
    const years = await this.prisma.movie.findMany({
      where: { releaseYear: { not: null } },
      distinct: ['releaseYear'],
      select: { releaseYear: true },
      orderBy: { releaseYear: 'desc' },
    });
    return { years: years.map((movie) => movie.releaseYear) };
  }

  async highlights() {
    const [catalog, recentReviews] = await Promise.all([
      this.list(undefined, 1, 6),
      this.prisma.review.findMany({
        take: 3,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: {
          movie: { include: { genres: true } },
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
    ]);
    return { movies: catalog.data, recentReviews };
  }

  async getById(id: string) {
    const movie = await this.prisma.movie.findUnique({
      where: { id },
      include: {
        genres: true,
        reviews: {
          orderBy: { watchedAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
    if (!movie) throw new NotFoundException('Filme não encontrado');
    const { reviews, ...details } = movie;
    return {
      ...details,
      ratingCount: reviews.length,
      averageRating: reviews.length
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : null,
      reviews,
    };
  }

  private async validateGenres(genreIds: string[] = []) {
    if (
      (await this.prisma.genre.count({ where: { id: { in: genreIds } } })) !==
      genreIds.length
    ) {
      throw new BadRequestException('Um ou mais gêneros não existem');
    }
  }

  async create({ genreIds = [], ...input }: CreateMovieDto) {
    await this.validateGenres(genreIds);
    if (!input.title.trim()) throw new BadRequestException('Informe o título');
    return this.prisma.movie.create({
      data: {
        ...input,
        title: input.title.trim(),
        genres: { connect: genreIds.map((id) => ({ id })) },
      },
      include: { genres: true },
    });
  }

  async update(id: string, { genreIds, ...input }: CreateMovieDto) {
    await this.getById(id);
    await this.validateGenres(genreIds);
    if (!input.title.trim()) throw new BadRequestException('Informe o título');
    return this.prisma.movie.update({
      where: { id },
      data: {
        ...input,
        title: input.title.trim(),
        ...(genreIds
          ? { genres: { set: genreIds.map((id) => ({ id })) } }
          : {}),
      },
      include: { genres: true },
    });
  }

  async remove(id: string) {
    await this.getById(id);
    await this.prisma.movie.delete({ where: { id } });
    return { deleted: true };
  }

  async activity(movieId: string, userId: string) {
    const [watched, watchlist, review] = await Promise.all([
      this.prisma.watchedMovie.findUnique({
        where: { userId_movieId: { userId, movieId } },
      }),
      this.prisma.watchlistItem.findUnique({
        where: { userId_movieId: { userId, movieId } },
      }),
      this.prisma.review.findUnique({
        where: { userId_movieId: { userId, movieId } },
      }),
    ]);
    return {
      watched: Boolean(watched),
      inWatchlist: Boolean(watchlist),
      review,
    };
  }

  async markWatched(movieId: string, userId: string) {
    await this.getById(movieId);
    await this.prisma.watchedMovie.upsert({
      where: { userId_movieId: { userId, movieId } },
      create: { userId, movieId },
      update: {},
    });
    return { watched: true };
  }

  async review(movieId: string, userId: string, input: CreateReviewDto) {
    await this.getById(movieId);
    const watchedAt = input.watchedAt ? new Date(input.watchedAt) : undefined;
    const [review] = await this.prisma.$transaction([
      this.prisma.review.upsert({
        where: { userId_movieId: { userId, movieId } },
        create: {
          userId,
          movieId,
          rating: input.rating,
          comment: input.comment,
          watchedAt,
        },
        update: { rating: input.rating, comment: input.comment, watchedAt },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.watchedMovie.upsert({
        where: { userId_movieId: { userId, movieId } },
        create: { userId, movieId, watchedAt },
        update: watchedAt ? { watchedAt } : {},
      }),
    ]);
    return review;
  }

  async removeReview(movieId: string, userId: string) {
    const result = await this.prisma.review.deleteMany({
      where: { movieId, userId },
    });
    if (result.count === 0)
      throw new NotFoundException('Avaliação não encontrada');
    return { deleted: true };
  }
}
