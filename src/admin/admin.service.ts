import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword } from '../auth/password';
import { AdminUserDto } from './admin.dto';

const userSelect = {
  id: true,
  username: true,
  displayName: true,
  email: true,
  role: true,
  createdAt: true,
  _count: { select: { reviews: true, watched: true } },
} as const;
const reviewInclude = {
  movie: { include: { genres: true } },
  user: {
    select: { id: true, username: true, displayName: true, email: true },
  },
} as const;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}
  async dashboard() {
    const [movies, genres, users, reviews, recent, distribution] =
      await Promise.all([
        this.prisma.movie.count(),
        this.prisma.genre.count(),
        this.prisma.user.count(),
        this.prisma.review.count(),
        this.prisma.review.findMany({
          take: 6,
          orderBy: { watchedAt: 'desc' },
          include: reviewInclude,
        }),
        this.prisma.genre.findMany({
          include: { _count: { select: { movies: true } } },
          orderBy: { id: 'asc' },
        }),
      ]);
    return { movies, genres, users, reviews, recent, distribution };
  }
  users() {
    return this.prisma.user.findMany({
      select: userSelect,
      orderBy: { displayName: 'asc' },
    });
  }
  async user(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }
  async updateUser(id: string, input: AdminUserDto, actorId: string) {
    await this.user(id);
    if (id === actorId && input.role !== 'ADMIN')
      throw new ConflictException(
        'Não é possível remover seu próprio acesso administrativo',
      );
    const { password, ...data } = input;
    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...data,
          email: input.email.toLowerCase(),
          ...(password ? { passwordHash: await hashPassword(password) } : {}),
        },
        select: userSelect,
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002')
        throw new ConflictException('E-mail já cadastrado');
      throw error;
    }
  }
  reviews() {
    return this.prisma.review.findMany({
      orderBy: { watchedAt: 'desc' },
      include: reviewInclude,
    });
  }
  async review(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: reviewInclude,
    });
    if (!review) throw new NotFoundException('Avaliação não encontrada');
    return review;
  }
  async removeReview(id: string) {
    await this.review(id);
    await this.prisma.review.delete({ where: { id } });
    return { deleted: true };
  }
}
