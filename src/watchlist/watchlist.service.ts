import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WatchlistService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const items = await this.prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { addedAt: 'desc' },
      include: { movie: { include: { reviews: { select: { rating: true } } } } },
    });
    return items.map(({ movie, addedAt }) => ({
      addedAt,
      movie: {
        ...movie,
        ratingCount: movie.reviews.length,
        averageRating: movie.reviews.length
          ? movie.reviews.reduce((sum, review) => sum + review.rating, 0) /
            movie.reviews.length
          : null,
        reviews: undefined,
      },
    }));
  }

  async add(userId: string, movieId: string) {
    const movie = await this.prisma.movie.findUnique({
      where: { id: movieId },
      select: { id: true },
    });
    if (!movie) throw new NotFoundException('Filme não encontrado');
    await this.prisma.watchlistItem.upsert({
      where: { userId_movieId: { userId, movieId } },
      create: { userId, movieId },
      update: {},
    });
    return { inWatchlist: true };
  }

  async remove(userId: string, movieId: string) {
    await this.prisma.watchlistItem.deleteMany({ where: { userId, movieId } });
    return { inWatchlist: false };
  }
}