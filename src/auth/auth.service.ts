import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { PrismaService } from '../prisma/prisma.service';
import { createAccessToken } from './auth.guard';
import { LoginDto, RegisterDto } from './auth.dto';

const scrypt = promisify(nodeScrypt);

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(input: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: input.email.toLowerCase() }, { username: input.username }] },
      select: { id: true },
    });
    if (existing) throw new ConflictException('E-mail ou nome de usuário já cadastrado');

    const salt = randomBytes(16).toString('hex');
    const hash = (await scrypt(input.password, salt, 64)) as Buffer;
    const user = await this.prisma.user.create({
      data: {
        username: input.username,
        email: input.email.toLowerCase(),
        passwordHash: `${salt}:${hash.toString('hex')}`,
      },
      select: { id: true, username: true, email: true, createdAt: true },
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
    if (candidate.length !== expected.length || !timingSafeEqual(candidate, expected)) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    return {
      user: { id: user.id, username: user.username, email: user.email },
      accessToken: createAccessToken(user),
    };
  }
}