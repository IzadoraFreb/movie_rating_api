import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMovieDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsInt()
  @Min(1888)
  @Max(new Date().getFullYear() + 10)
  releaseYear?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  director?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  synopsis?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  posterUrl?: string;
}

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @IsOptional()
  @IsDateString()
  watchedAt?: string;
}