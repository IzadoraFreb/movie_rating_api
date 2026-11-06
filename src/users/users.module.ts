import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ProfileImagesService } from './profile-images.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, ProfileImagesService],
})
export class UsersModule {}
