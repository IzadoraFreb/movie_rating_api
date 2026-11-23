import {
  BadRequestException,
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { TmdbService } from './tmdb.service';

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
}