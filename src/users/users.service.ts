import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async profile(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        _count: { select: { reviews: true, followers: true, following: true } },
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  updateProfile(userId: string, input: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: input,
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
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
    if (target.id === userId) throw new ConflictException('Não é possível seguir a si mesmo');
    await this.prisma.follow.upsert({
      where: { followerId_followingId: { followerId: userId, followingId: target.id } },
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
      where: direction === 'followers' ? { followingId: user.id } : { followerId: user.id },
      include: {
        [direction === 'followers' ? 'follower' : 'following']: {
          select: { id: true, username: true, displayName: true, avatarUrl: true },
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