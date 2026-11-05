import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
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
    @Query('genre') genre?: string,
    @Query('year') year?: string,
    @Query('rating') rating?: string,
  ) {
    return this.moviesService.list(
      search,
      Number(page),
      Number(limit),
      genre,
      year,
      rating,
    );
  }

  @Get('filters')
  filters() {
    return this.moviesService.filters();
  }

  @Get('highlights')
  highlights() {
    return this.moviesService.highlights();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.moviesService.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() body: CreateMovieDto) {
    return this.moviesService.create(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() body: CreateMovieDto) {
    return this.moviesService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.moviesService.remove(id);
  }

  @Get(':id/activity')
  @UseGuards(JwtAuthGuard)
  activity(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.moviesService.activity(id, request.user.sub);
  }

  @Put(':id/watched')
  @UseGuards(JwtAuthGuard)
  watched(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.moviesService.markWatched(id, request.user.sub);
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
  removeReview(
    @Param('id') movieId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.moviesService.removeReview(movieId, request.user.sub);
  }
}
