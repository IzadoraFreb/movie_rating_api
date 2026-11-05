import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.guard';
import { AdminUserDto } from './admin.dto';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}
  @Get('dashboard') dashboard() {
    return this.admin.dashboard();
  }
  @Get('users') users() {
    return this.admin.users();
  }
  @Get('users/:id') user(@Param('id') id: string) {
    return this.admin.user(id);
  }
  @Patch('users/:id') updateUser(
    @Param('id') id: string,
    @Body() body: AdminUserDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.admin.updateUser(id, body, request.user.sub);
  }
  @Get('reviews') reviews() {
    return this.admin.reviews();
  }
  @Get('reviews/:id') review(@Param('id') id: string) {
    return this.admin.review(id);
  }
  @Delete('reviews/:id') removeReview(@Param('id') id: string) {
    return this.admin.removeReview(id);
  }
}
