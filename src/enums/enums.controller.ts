import {
  Controller,
  Post,
  Body,
  NotFoundException,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';

import { EnumOption } from './enum-option.entity';
import { EnumService } from './enums.service';
import { CreateEnumOptionDto } from './dto/create-enum-option.dto';
// import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
// import { RolesGuard } from 'src/auth/roles.guard';
import { RolesDecorator } from 'src/auth/app.decorator'; // decorator
import { Roles as RoleEnum } from 'src/constants/app.enums';
import { JwtAuthGuard, RolesGuard } from 'src/guards';
@Controller('enum')
export class EnumController {
  constructor(private readonly enumService: EnumService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RolesDecorator(RoleEnum.SUPER_ADMIN)
  async create(@Body() createEnumOptionDto: CreateEnumOptionDto): Promise<EnumOption> {
    return this.enumService.create(createEnumOptionDto);
  }

  // GET /list - get all grouped by category
  @Get()
  async getAllGrouped() {
    return this.enumService.getAllGroupedByCategory();
  }

  // GET /list/:id - get category by id and its children
  @Get(':id')
  async getByCategory(@Param('id', ParseIntPipe) id: number) {
    const result = await this.enumService.getByCategoryId(id);
    if (!result) {
      throw new NotFoundException(`Category with id ${id} not found or is not a parent category.`);
    }
    return result;
  }
}
