import { PartialType } from '@nestjs/mapped-types';
import { CreateDiningSpaceDto } from './create-dining-space.dto';

export class UpdateDiningSpaceDto extends PartialType(CreateDiningSpaceDto) {}
