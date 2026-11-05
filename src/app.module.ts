import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { GenresModule } from './genres/genres.module';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { MoviesModule } from './movies/movies.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { WatchlistModule } from './watchlist/watchlist.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MoviesModule,
    UsersModule,
    WatchlistModule,
    GenresModule,
    AdminModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
