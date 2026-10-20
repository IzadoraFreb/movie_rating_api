import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.guard';
import { UpdateProfileDto } from './user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return this.usersService.profile(request.user.username);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Body() body: UpdateProfileDto, @Req() request: AuthenticatedRequest) {
    return this.usersService.updateProfile(request.user.sub, body);
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
  follow(@Param('username') username: string, @Req() request: AuthenticatedRequest) {
    return this.usersService.follow(request.user.sub, username);
  }

  @Delete(':username/follow')
  @UseGuards(JwtAuthGuard)
  unfollow(@Param('username') username: string, @Req() request: AuthenticatedRequest) {
    return this.usersService.unfollow(request.user.sub, username);
  }
}