import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateEnumOptionDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  category: string;
}
