import { PartialType } from '@nestjs/mapped-types';
import { CreateFleetDto } from './createFleet.dto';

export class UpdateFleetDto extends PartialType(CreateFleetDto) {}
