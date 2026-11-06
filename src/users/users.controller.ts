import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.guard';
import { UpdateProfileDto } from './user.dto';
import { UsersService } from './users.service';
import { ProfileImagesService } from './profile-images.service';
import type { ProfileFiles } from './profile-images.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly images: ProfileImagesService,
  ) {}

  @Get('images/:filename')
  @Header('X-Content-Type-Options', 'nosniff')
  image(@Param('filename') filename: string) {
    return this.images.read(filename);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return this.usersService.me(request.user.sub);
  }

  @Get('me/watched')
  @UseGuards(JwtAuthGuard)
  watched(@Req() request: AuthenticatedRequest) {
    return this.usersService.watched(request.user.sub);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'avatar', maxCount: 1 },
        { name: 'banner', maxCount: 1 },
      ],
      {
        limits: {
          fileSize: 5 * 1024 * 1024,
          files: 2,
          fields: 8,
          fieldSize: 4096,
        },
      },
    ),
  )
  updateProfile(
    @Body() body: UpdateProfileDto,
    @Req() request: AuthenticatedRequest,
    @UploadedFiles() files?: ProfileFiles,
  ) {
    return this.usersService.updateProfile(request.user.sub, body, files);
  }

  @Get(':username')
  profile(@Param('username') username: string) {
    return this.usersService.profile(username);
  }

  @Get(':username/reviews')
  reviews(@Param('username') username: string) {
    return this.usersService.reviews(username);
  }

  @Get(':username/followers')
  followers(@Param('username') username: string) {
    return this.usersService.connections(username, 'followers');
  }

  @Get(':username/following')
  following(@Param('username') username: string) {
    return this.usersService.connections(username, 'following');
  }

  @Post(':username/follow')
  @UseGuards(JwtAuthGuard)
  follow(
    @Param('username') username: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.usersService.follow(request.user.sub, username);
  }

  @Delete(':username/follow')
  @UseGuards(JwtAuthGuard)
  unfollow(
    @Param('username') username: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.usersService.unfollow(request.user.sub, username);
  }
}
