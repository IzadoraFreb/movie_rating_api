import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './user.dto';
import { ProfileImagesService } from './profile-images.service';
import type { ProfileFiles } from './profile-images.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly images: ProfileImagesService,
  ) {}

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        bannerUrl: true,
        role: true,
        createdAt: true,
        _count: { select: { reviews: true, watched: true, watchlist: true } },
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async watched(userId: string) {
    const records = await this.prisma.watchedMovie.findMany({
      where: { userId },
      orderBy: { watchedAt: 'desc' },
      include: {
        movie: {
          include: {
            genres: true,
            reviews: { where: { userId }, select: { rating: true } },
          },
        },
      },
    });
    return records.map(({ movie, ...record }) => ({
      ...record,
      movie: {
        ...movie,
        myRating: movie.reviews[0]?.rating ?? null,
        reviews: undefined,
      },
    }));
  }

  async profile(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        bannerUrl: true,
        createdAt: true,
        _count: {
          select: {
            reviews: true,
            watched: true,
            followers: true,
            following: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileDto,
    files: ProfileFiles = {},
  ) {
    await this.me(userId);
    const { removeAvatar, removeBanner, ...data } = input;
    const avatar = files.avatar?.[0];
    const banner = files.banner?.[0];
    if (avatar) this.images.validate(avatar);
    if (banner) this.images.validate(banner);
    const saved: string[] = [];
    try {
      if (removeAvatar) data.avatarUrl = null;
      if (removeBanner) data.bannerUrl = null;
      if (avatar) {
        data.avatarUrl = await this.images.save(avatar);
        saved.push(data.avatarUrl);
      }
      if (banner) {
        data.bannerUrl = await this.images.save(banner);
        saved.push(data.bannerUrl);
      }
      return await this.prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          username: true,
          displayName: true,
          bio: true,
          avatarUrl: true,
          bannerUrl: true,
          createdAt: true,
        },
      });
    } catch (error) {
      await Promise.all(saved.map((url) => this.images.discard(url)));
      throw error;
    }
  }

  async reviews(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return this.prisma.review.findMany({
      where: { userId: user.id },
      orderBy: { watchedAt: 'desc' },
      include: { movie: true },
    });
  }

  async follow(userId: string, username: string) {
    const target = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!target) throw new NotFoundException('Usuário não encontrado');
    if (target.id === userId)
      throw new ConflictException('Não é possível seguir a si mesmo');
    await this.prisma.follow.upsert({
      where: {
        followerId_followingId: { followerId: userId, followingId: target.id },
      },
      create: { followerId: userId, followingId: target.id },
      update: {},
    });
    return { following: true };
  }

  async unfollow(userId: string, username: string) {
    const target = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!target) throw new NotFoundException('Usuário não encontrado');
    await this.prisma.follow.deleteMany({
      where: { followerId: userId, followingId: target.id },
    });
    return { following: false };
  }

  async connections(username: string, direction: 'followers' | 'following') {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    const records = await this.prisma.follow.findMany({
      where:
        direction === 'followers'
          ? { followingId: user.id }
          : { followerId: user.id },
      include: {
        [direction === 'followers' ? 'follower' : 'following']: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map((record) =>
      direction === 'followers'
        ? (record as typeof record & { follower: unknown }).follower
        : (record as typeof record & { following: unknown }).following,
    );
  }
}
