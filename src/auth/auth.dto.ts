import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9_]{3,24}$/)
  username!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}