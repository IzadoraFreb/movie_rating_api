import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovieDto, CreateReviewDto } from './movie.dto';

@Injectable()
export class MoviesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(search: string | undefined, page: number, limit: number) {
    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safeLimit = Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 50) : 20;
    const where = search
      ? { title: { contains: search } }
      : {};
    const [movies, total] = await Promise.all([
      this.prisma.movie.findMany({
        where,
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        orderBy: { title: 'asc' },
        include: { reviews: { select: { rating: true } } },
      }),
      this.prisma.movie.count({ where }),
    ]);
    return {
      page: safePage,
      limit: safeLimit,
      total,
      data: movies.map(({ reviews, ...movie }) => ({
        ...movie,
        ratingCount: reviews.length,
        averageRating: reviews.length
          ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
          : null,
      })),
    };
  }

  async getById(id: string) {
    const movie = await this.prisma.movie.findUnique({
      where: { id },
      include: {
        reviews: {
          orderBy: { watchedAt: 'desc' },
          include: { user: { select: { id: true, username: true, displayName: true } } },
        },
      },
    });
    if (!movie) throw new NotFoundException('Filme não encontrado');
    const { reviews, ...details } = movie;
    return {
      ...details,
      ratingCount: reviews.length,
      averageRating: reviews.length
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : null,
      reviews,
    };
  }

  create(input: CreateMovieDto) {
    return this.prisma.movie.create({ data: input });
  }

  async review(movieId: string, userId: string, input: CreateReviewDto) {
    const movieExists = await this.prisma.movie.findUnique({
      where: { id: movieId },
      select: { id: true },
    });
    if (!movieExists) throw new NotFoundException('Filme não encontrado');
    return this.prisma.review.upsert({
      where: { userId_movieId: { userId, movieId } },
      create: {
        userId,
        movieId,
        rating: input.rating,
        comment: input.comment,
        watchedAt: input.watchedAt ? new Date(input.watchedAt) : undefined,
      },
      update: {
        rating: input.rating,
        comment: input.comment,
        watchedAt: input.watchedAt ? new Date(input.watchedAt) : undefined,
      },
      include: { user: { select: { id: true, username: true, displayName: true } } },
    });
  }

  async removeReview(movieId: string, userId: string) {
    const result = await this.prisma.review.deleteMany({ where: { movieId, userId } });
    if (result.count === 0) throw new NotFoundException('Avaliação não encontrada');
    return { deleted: true };
  }
}