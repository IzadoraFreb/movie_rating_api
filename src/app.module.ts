import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { MoviesModule } from './movies/movies.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { WatchlistModule } from './watchlist/watchlist.module';

@Module({
  imports: [PrismaModule, AuthModule, MoviesModule, UsersModule, WatchlistModule],
  controllers: [AppController],
})
export class AppModule {}
