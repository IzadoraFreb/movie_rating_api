import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.guard';
import { CreateMovieDto, CreateReviewDto } from './movie.dto';
import { MoviesService } from './movies.service';

@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  list(
    @Query('q') search?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.moviesService.list(search, Number(page), Number(limit));
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.moviesService.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() body: CreateMovieDto) {
    return this.moviesService.create(body);
  }

  @Put(':id/review')
  @UseGuards(JwtAuthGuard)
  review(
    @Param('id') movieId: string,
    @Body() body: CreateReviewDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.moviesService.review(movieId, request.user.sub, body);
  }

  @Delete(':id/review')
  @UseGuards(JwtAuthGuard)
  removeReview(@Param('id') movieId: string, @Req() request: AuthenticatedRequest) {
    return this.moviesService.removeReview(movieId, request.user.sub);
  }
}