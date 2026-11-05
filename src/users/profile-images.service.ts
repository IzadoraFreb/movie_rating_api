import {
  BadRequestException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export interface ProfileImage {
  buffer: Buffer;
  mimetype: string;
  size: number;
}
export type ProfileFiles = { avatar?: ProfileImage[]; banner?: ProfileImage[] };

const filenamePattern = /^[a-f0-9-]{36}\.(png|jpg|webp)$/;

@Injectable()
export class ProfileImagesService {
  private readonly directory = resolve(
    process.env.PROFILE_UPLOAD_DIR || 'uploads/profiles',
  );

  validate(file: ProfileImage) {
    const bytes = file.buffer;
    if (!bytes.length || bytes.length > 5 * 1024 * 1024)
      throw new BadRequestException('Cada imagem deve ter até 5 MB.');
    let format: { extension: string; mime: string } | undefined;
    if (
      bytes.length >= 24 &&
      bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    )
      format = { extension: 'png', mime: 'image/png' };
    else if (
      bytes.length >= 4 &&
      bytes[0] === 255 &&
      bytes[1] === 216 &&
      bytes[2] === 255
    )
      format = { extension: 'jpg', mime: 'image/jpeg' };
    else if (
      bytes.length >= 20 &&
      bytes.toString('ascii', 0, 4) === 'RIFF' &&
      bytes.toString('ascii', 8, 12) === 'WEBP'
    )
      format = { extension: 'webp', mime: 'image/webp' };
    if (!format || file.mimetype !== format.mime)
      throw new BadRequestException(
        'Escolha uma imagem PNG, JPG ou WebP válida.',
      );
    return format;
  }

  async save(file: ProfileImage) {
    const { extension } = this.validate(file);
    await mkdir(this.directory, { recursive: true });
    const filename = randomUUID() + '.' + extension;
    await writeFile(resolve(this.directory, filename), file.buffer, {
      flag: 'wx',
    });
    return '/api/users/images/' + filename;
  }

  async discard(url: string) {
    const filename = url.split('/').at(-1) || '';
    if (filenamePattern.test(filename))
      await unlink(resolve(this.directory, filename)).catch(() => {});
  }

  async read(filename: string) {
    if (!filenamePattern.test(filename))
      throw new NotFoundException('Imagem não encontrada');
    let bytes: Buffer;
    try {
      bytes = await readFile(resolve(this.directory, filename));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT')
        throw new NotFoundException('Imagem não encontrada');
      throw error;
    }
    const type = filename.endsWith('.jpg')
      ? 'image/jpeg'
      : filename.endsWith('.webp')
        ? 'image/webp'
        : 'image/png';
    return new StreamableFile(bytes, { type });
  }
}
