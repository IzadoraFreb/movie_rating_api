import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user: { sub: string; username: string };
}

function tokenSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production');
  }
  return 'local-development-secret-change-before-deploy';
}

function verifyToken(token: string): AuthenticatedRequest['user'] {
  let decoded: string | jwt.JwtPayload;
  try {
    decoded = jwt.verify(token, tokenSecret(), { algorithms: ['HS256'] });
  } catch {
    throw new UnauthorizedException('Token inválido ou expirado');
  }
  if (
    typeof decoded === 'string' ||
    typeof decoded.sub !== 'string' ||
    typeof decoded.username !== 'string'
  ) {
    throw new UnauthorizedException('Token inválido');
  }
  return { sub: decoded.sub, username: decoded.username };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const [scheme, token] = authorization?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Informe um token Bearer');
    }
    request.user = verifyToken(token);
    return true;
  }
}

export function createAccessToken(user: { id: string; username: string }): string {
  return jwt.sign({ username: user.username }, tokenSecret(), {
    algorithm: 'HS256',
    subject: user.id,
    expiresIn: '7d',
  });
}