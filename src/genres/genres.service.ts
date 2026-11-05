import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GenresService {
  constructor(private readonly prisma: PrismaService) {}
  list() {
    return this.prisma.genre.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { movies: true } } },
    });
  }
  async save(name: string, id?: string) {
    const trimmed = name.trim();
    if (!trimmed) throw new BadRequestException('Informe o nome do gênero');
    const existing = await this.prisma.genre.findFirst({
      where: { name: { equals: trimmed } },
    });
    if (existing && existing.id !== id)
      throw new ConflictException('Este gênero já está cadastrado');
    try {
      return id
        ? await this.prisma.genre.update({
            where: { id },
            data: { name: trimmed },
          })
        : await this.prisma.genre.create({ data: { name: trimmed } });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === 'P2025')
        throw new NotFoundException('Gênero não encontrado');
      if (code === 'P2002')
        throw new ConflictException('Este gênero já está cadastrado');
      throw error;
    }
  }
  async remove(id: string) {
    const genre = await this.prisma.genre.findUnique({
      where: { id },
      include: { _count: { select: { movies: true } } },
    });
    if (!genre) throw new NotFoundException('Gênero não encontrado');
    if (genre._count.movies)
      throw new ConflictException(
        'Remova este gênero dos filmes antes de excluí-lo',
      );
    await this.prisma.genre.delete({ where: { id } });
    return { deleted: true };
  }
}
