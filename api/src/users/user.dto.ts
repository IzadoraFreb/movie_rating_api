import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

function formBoolean({ value }: { value: unknown }) {
  return value === 'true' ? true : value === 'false' ? false : value;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(2)
  @MaxLength(80)
  displayName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  avatarUrl?: string | null;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  bannerUrl?: string | null;

  @IsOptional()
  @Transform(formBoolean)
  @IsBoolean()
  removeAvatar?: boolean;

  @IsOptional()
  @Transform(formBoolean)
  @IsBoolean()
  removeBanner?: boolean;
}
