// src/super-admin/dto/login.dto.ts
import { IsEmail, IsString } from 'class-validator';

export class SuperAdminLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  role: string;
}
