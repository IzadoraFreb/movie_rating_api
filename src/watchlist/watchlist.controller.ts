import { Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.guard';
import { WatchlistService } from './watchlist.service';

@Controller('watchlist')
@UseGuards(JwtAuthGuard)
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.watchlistService.list(request.user.sub);
  }

  @Post(':movieId')
  add(@Param('movieId') movieId: string, @Req() request: AuthenticatedRequest) {
    return this.watchlistService.add(request.user.sub, movieId);
  }

  @Delete(':movieId')
  remove(@Param('movieId') movieId: string, @Req() request: AuthenticatedRequest) {
    return this.watchlistService.remove(request.user.sub, movieId);
  }
}