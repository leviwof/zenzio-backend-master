import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createEventDto: CreateEventDto, @Req() req: any) {
    // Automatically set restaurant_id from the authenticated user
    if (req.user && req.user.uid) {
      createEventDto.restaurant_id = req.user.uid;
    }
    const result = await this.eventsService.create(createEventDto);
    return { data: result };
  }

  // Admin can create events for any restaurant
  @Post('admin-create')
  async createByAdmin(@Body() createEventDto: CreateEventDto) {
    // For admin, the restaurant_id comes from the request body
    if (!createEventDto.restaurant_id) {
      throw new Error('restaurant_id is required');
    }
    // Set status to APPROVED automatically for admin-created events
    const result = await this.eventsService.createApproved(createEventDto);
    return {
      status: 'success',
      data: result,
      message: 'Event created successfully by admin',
    };
  }

  // Define specific routes BEFORE generic :id route

  @Get('pending')
  async getPendingEvents(@Query() params: any) {
    const result = await this.eventsService.findPending(params);
    return { data: result };
  }

  @Get('stats')
  getStats(@Query() params: any) {
    // Placeholder for stats
    return { data: { message: 'Stats not implemented yet' } };
  }

  @Get('approval/:id')
  async getEventForApproval(@Param('id') id: string) {
    const result = await this.eventsService.findOne(id);
    return { data: result };
  }

  @Put('approve/:id')
  async approveEvent(@Param('id') id: string) {
    const result = await this.eventsService.approve(id);
    return { data: result };
  }

  @Put('reject/:id')
  async rejectEvent(@Param('id') id: string, @Body() body: { reason: string }) {
    const result = await this.eventsService.reject(id, body.reason);
    return { data: result };
  }

  @Get('restaurant/:restaurantId')
  async findAllByRestaurant(@Param('restaurantId') restaurantId: string) {
    const result = await this.eventsService.findAllByRestaurant(restaurantId);
    return { data: result };
  }

  @Get()
  async findAll(@Query() params: any) {
    const result = await this.eventsService.findAll(params);
    return { data: result };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.eventsService.findOne(id);
    return { data: result };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    const result = await this.eventsService.update(id, updateEventDto);
    return { data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.eventsService.remove(id);
    return { success: true, message: 'Event deleted successfully' };
  }
}
