import {
  BadRequestException,
  Controller,
  Get,
  Header,
  NotFoundException,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { findLocalMoviePosterFile } from './movie-posters';

const imageTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.jpe': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

@Controller('posters')
export class PostersController {
  @Get()
  @Header('Cache-Control', 'public, max-age=3600')
  @Header('X-Content-Type-Options', 'nosniff')
  async get(@Query('title') title?: string) {
    if (typeof title !== 'string' || !title.trim()) {
      throw new BadRequestException('Título obrigatório');
    }
    const file = await findLocalMoviePosterFile(title.trim());
    if (!file) throw new NotFoundException('Capa não encontrada');
    return new StreamableFile(await readFile(file), {
      type: imageTypes[extname(file).toLowerCase()],
    });
  }
}
