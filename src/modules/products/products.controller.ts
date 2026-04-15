import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsDto } from './dto/products.dto';
import { Products } from './products.entity';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async create(@Body() data: ProductsDto) {
    const item: Products = await this.productsService.create(data);
    return {
      status: 'success',
      code: 201,
      data: { products: item },
      message: 'Products created successfully',
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Get()
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    const [items, total] = await this.productsService.findAllWithPagination(+page, +limit);
    return {
      status: 'success',
      code: 200,
      data: { productss: items },
      meta: {
        timestamp: new Date().toISOString(),
        total,
        page: +page,
        limit: +limit,
        totalPages: Math.ceil(total / +limit),
      },
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const item: Products | null = await this.productsService.findOne(+id);
    return {
      status: item ? 'success' : 'error',
      code: item ? 200 : 404,
      data: item ? { products: item } : null,
      message: item ? 'Products fetched successfully' : 'Products not found',
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async update(@Param('id') id: string, @Body() data: ProductsDto) {
    const item: Products | null = await this.productsService.update(+id, data);
    return {
      status: item ? 'success' : 'error',
      code: item ? 200 : 404,
      data: item ? { products: item } : null,
      message: item ? 'Products updated successfully' : 'Products not found',
      meta: { timestamp: new Date().toISOString() },
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const item: boolean = await this.productsService.remove(+id);
    return {
      status: item ? 'success' : 'error',
      code: item ? 200 : 404,
      data: null,
      message: item ? 'Products deleted successfully' : 'Products not found',
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /** Soft delete endpoint */
  @Delete(':id/soft')
  async softDelete(@Param('id') id: string) {
    const item: boolean = await this.productsService.softDelete(+id);
    return {
      status: item ? 'success' : 'error',
      code: item ? 200 : 404,
      data: null,
      message: item ? 'Products soft deleted successfully' : 'Products not found',
      meta: { timestamp: new Date().toISOString() },
    };
  }
}
