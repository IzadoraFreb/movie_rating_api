import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { GenresModule } from './genres/genres.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { MoviesModule } from './movies/movies.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { WatchlistModule } from './watchlist/watchlist.module';
import { TmdbModule } from './tmdb/tmdb.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MoviesModule,
    UsersModule,
    WatchlistModule,
    GenresModule,
    AdminModule,
    TmdbModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
