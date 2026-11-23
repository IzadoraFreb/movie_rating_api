import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TmdbService } from './tmdb.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('tmdb')
export class TmdbController {
  constructor(private readonly tmdbService: TmdbService) {}

  @Get('search')
  search(
    @Query('q') query?: string,
    @Query('page') page = '1',
  ) {
    const search = query?.trim();

    if (!search) {
      throw new BadRequestException(
        'Informe o nome de um filme no parâmetro q.',
      );
    }

    const pageNumber = Number(page);

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      pageNumber > 500
    ) {
      throw new BadRequestException(
        'A página deve ser um número inteiro entre 1 e 500.',
      );
    }

    return this.tmdbService.searchMovies(search, pageNumber);
  }

  @Get('movies/:tmdbId')
  details(@Param('tmdbId') tmdbId: string) {
    const id = Number(tmdbId);

    if (!Number.isSafeInteger(id) || id < 1) {
      throw new BadRequestException(
        'O identificador do filme deve ser um inteiro positivo.',
      );
    }

    return this.tmdbService.getMovieDetails(id);
  }
  @Post('movies/:tmdbId/import')
@UseGuards(JwtAuthGuard, AdminGuard)
importMovie(@Param('tmdbId') tmdbId: string) {
  const id = Number(tmdbId);

  if (!Number.isSafeInteger(id) || id < 1) {
    throw new BadRequestException(
      'O identificador do filme deve ser um inteiro positivo.',
    );
  }

  return this.tmdbService.importMovie(id);
}
}