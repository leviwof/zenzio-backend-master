import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { RestaurantEnumService } from './restaurant_enum.service';
import { RestaurantEnumDto } from './dto/restaurant_enum.dto';

@ApiTags('Restaurant Enum')
@Controller('restaurant_enum')
export class RestaurantEnumController {
  constructor(private readonly restaurantEnumService: RestaurantEnumService) {}

  /** 🔹 Create Enum (with duplicate check & safe error typing) */
  @Post()
  @ApiOperation({ summary: 'Create a new enum/category or subcategory value' })
  @ApiBody({ type: RestaurantEnumDto })
  @ApiResponse({ status: 201, description: 'Enum value created successfully' })
  @ApiResponse({ status: 400, description: 'Duplicate entry or validation error' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(@Body() dto: RestaurantEnumDto) {
    try {
      const item = await this.restaurantEnumService.create(dto);
      return {
        status: 'success',
        code: 201,
        data: item,
        message: 'Enum value created successfully',
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error instanceof Error) throw new BadRequestException(error.message);
      throw new BadRequestException('Unexpected error occurred');
    }
  }

  /** 🔹 Get all enums */
  @Get()
  @ApiOperation({ summary: 'Fetch all enums/categories' })
  @ApiResponse({ status: 200, description: 'All enum records fetched successfully' })
  async findAll() {
    const items = await this.restaurantEnumService.findAll();
    return { status: 'success', code: 200, data: items };
  }

  /** 🔹 Get top-level groups */
  @Get('groups')
  @ApiOperation({ summary: 'Fetch all top-level category groups (father_id=0 & parent_id=0)' })
  @ApiResponse({ status: 200, description: 'Top-level groups fetched successfully' })
  async findGroups() {
    const items = await this.restaurantEnumService.findGroups();
    return { status: 'success', code: 200, data: items };
  }

  /** 🔹 Get children by parent_id */
  @Get('children/:parent_id')
  @ApiOperation({ summary: 'Fetch all children (subcategories) by parent_id' })
  @ApiParam({
    name: 'parent_id',
    example: 1,
    description: 'Parent ID (category or subcategory)',
  })
  @ApiResponse({ status: 200, description: 'Children fetched successfully' })
  async findChildren(@Param('parent_id') parent_id: string) {
    const items = await this.restaurantEnumService.findByParent(+parent_id);
    return { status: 'success', code: 200, data: items };
  }

  /** 🔹 Get all enums/items by father_id (entire main group hierarchy) */
  @Get('father/:father_id')
  @ApiOperation({
    summary: 'Fetch all items belonging to a specific father_id (entire category tree)',
  })
  @ApiParam({
    name: 'father_id',
    example: 1,
    description: 'Main category (father_id) to fetch all related items',
  })
  @ApiResponse({
    status: 200,
    description: 'All items under the given father_id fetched successfully',
  })
  async findByFather(@Param('father_id') father_id: string) {
    const items = await this.restaurantEnumService.findByFather(+father_id);
    return {
      status: 'success',
      code: 200,
      data: items,
      message: `All items under father_id=${father_id} fetched successfully`,
      meta: { timestamp: new Date().toISOString() },
    };
  }

  /** 🔹 Get one enum by ID */
  @Get(':id')
  @ApiOperation({ summary: 'Fetch enum/category by ID' })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'Enum record fetched successfully' })
  @ApiResponse({ status: 404, description: 'Enum not found' })
  async findOne(@Param('id') id: string) {
    const item = await this.restaurantEnumService.findOne(+id);
    return item
      ? { status: 'success', code: 200, data: item }
      : { status: 'error', code: 404, message: 'Enum not found' };
  }

  /** 🔹 Update enum */
  @Put(':id')
  @ApiOperation({ summary: 'Update enum/category by ID (duplicate-safe)' })
  @ApiParam({ name: 'id', example: 2 })
  @ApiBody({ type: RestaurantEnumDto })
  @ApiResponse({ status: 200, description: 'Enum updated successfully' })
  @ApiResponse({ status: 400, description: 'Duplicate or invalid update' })
  async update(@Param('id') id: string, @Body() dto: RestaurantEnumDto) {
    try {
      const item = await this.restaurantEnumService.update(+id, dto);
      return item
        ? { status: 'success', code: 200, data: item }
        : { status: 'error', code: 404, message: 'Enum not found' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error instanceof Error) throw new BadRequestException(error.message);
      throw new BadRequestException('Unexpected error occurred');
    }
  }

  /** 🔹 Delete enum */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete enum/category by ID' })
  @ApiParam({ name: 'id', example: 3 })
  @ApiResponse({ status: 200, description: 'Enum deleted successfully' })
  @ApiResponse({ status: 404, description: 'Enum not found' })
  async remove(@Param('id') id: string) {
    const deleted = await this.restaurantEnumService.remove(+id);
    return deleted
      ? { status: 'success', code: 200, message: 'Enum deleted successfully' }
      : { status: 'error', code: 404, message: 'Enum not found' };
  }
}
