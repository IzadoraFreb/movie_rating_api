import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { createAccessToken } from './auth.guard';
import { LoginDto, RegisterDto } from './auth.dto';

import { hashPassword, scrypt } from './password';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(input: RegisterDto) {
    const username = input.username ?? `user_${randomBytes(8).toString('hex')}`;
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: input.email.toLowerCase() }, { username }] },
      select: { id: true },
    });
    if (existing)
      throw new ConflictException('E-mail ou nome de usuário já cadastrado');

    const passwordHash = await hashPassword(input.password);
    const user = await this.prisma.user
      .create({
        data: {
          username,
          displayName: input.displayName,
          email: input.email.toLowerCase(),
          passwordHash,
        },
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          role: true,
          createdAt: true,
        },
      })
      .catch((error: { code?: string }) => {
        if (error.code === 'P2002')
          throw new ConflictException(
            'E-mail ou nome de usuário já cadastrado',
          );
        throw error;
      });
    return { user, accessToken: createAccessToken(user) };
  }

  async login(input: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (!user) throw new UnauthorizedException('E-mail ou senha inválidos');

    const [salt, savedHash] = user.passwordHash.split(':');
    const candidate = (await scrypt(input.password, salt, 64)) as Buffer;
    const expected = Buffer.from(savedHash, 'hex');
    if (
      candidate.length !== expected.length ||
      !timingSafeEqual(candidate, expected)
    ) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
      accessToken: createAccessToken(user),
    };
  }
}
