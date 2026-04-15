import { Controller, Post, Body, Get, Param, Patch, Delete } from '@nestjs/common';
import { WorkTypeService } from './work-type.service';
import { CreateWorkTypeDto } from './dto/create-work-type.dto';
import { UpdateWorkTypeDto } from './dto/update-work-type.dto';

@Controller('work-types')
export class WorkTypeController {
  constructor(private readonly service: WorkTypeService) {}

  @Post()
  create(@Body() dto: CreateWorkTypeDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':uid')
  findOne(@Param('uid') uid: string) {
    return this.service.findOne(uid);
  }

  @Patch(':uid')
  update(@Param('uid') uid: string, @Body() dto: UpdateWorkTypeDto) {
    return this.service.update(uid, dto);
  }

  @Delete(':uid')
  remove(@Param('uid') uid: string) {
    return this.service.remove(uid);
  }
}
