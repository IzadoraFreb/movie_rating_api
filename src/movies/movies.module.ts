import { Module } from '@nestjs/common';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { PostersController } from './posters.controller';

@Module({
  controllers: [MoviesController, PostersController],
  providers: [MoviesService],
})
export class MoviesModule {}
