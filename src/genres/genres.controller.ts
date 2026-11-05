import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/auth.guard';
import { GenreDto } from './genre.dto';
import { GenresService } from './genres.service';

@Controller('genres')
export class GenresController {
  constructor(private readonly genres: GenresService) {}
  @Get()
  list() {
    return this.genres.list();
  }
  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() body: GenreDto) {
    return this.genres.save(body.name);
  }
  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() body: GenreDto) {
    return this.genres.save(body.name, id);
  }
  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.genres.remove(id);
  }
}
