import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateAdminDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  role: string;

  @IsNotEmpty()
  password: string;

  @IsOptional()
  photo?: string;

  // 👇 Add this so you can control active state at creation time
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
