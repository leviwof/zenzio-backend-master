import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  Delete,
  Param,
  UsePipes,
  ValidationPipe,
  NotFoundException,
} from '@nestjs/common';
import { EnumService } from '../enums/enums.service';
import { CreateEnumOptionDto } from '../enums/dto/create-enum-option.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly enumService: EnumService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(@Body() createEnumOptionDto: CreateEnumOptionDto) {
    try {
      const item = await this.enumService.create(createEnumOptionDto);
      return {
        status: 'success',
        code: 201,
        data: item,
        message: 'Category created successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof Error) throw new NotFoundException(error.message);
      throw new NotFoundException('Unexpected error occurred');
    }
  }

  @Get()
  async findAll() {
    const items = await this.enumService.findAll();
    return { status: 'success', code: 200, data: items };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const item = await this.enumService.findOne(+id);
    return item
      ? { status: 'success', code: 200, data: item }
      : { status: 'error', code: 404, message: 'Category not found' };
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async update(@Param('id') id: string, @Body() dto: CreateEnumOptionDto) {
    try {
      const item = await this.enumService.update(+id, dto);
      return item
        ? { status: 'success', code: 200, data: item }
        : { status: 'error', code: 404, message: 'Category not found' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof Error) throw new NotFoundException(error.message);
      throw new NotFoundException('Unexpected error occurred');
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const deleted = await this.enumService.remove(+id);
    return deleted
      ? { status: 'success', code: 200, message: 'Category deleted successfully' }
      : { status: 'error', code: 404, message: 'Category not found' };
  }
}
