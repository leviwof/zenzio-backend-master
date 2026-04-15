import { Body, Controller, Get, Post, Patch, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import { OperationalHoursService } from './operational-hours.service';
import { OperationalHour } from './entity/operational_hour.entity';
@ApiTags('Restaurant Operational Hours')
@Controller('operational-hours')
export class OperationalHoursController {
  constructor(private readonly operationalHoursService: OperationalHoursService) {}

  /**
   * ✅ Create default operational hours for a restaurant
   */
  @Post('restaurant/:uid/default')
  @ApiParam({
    name: 'uid',
    description: 'Unique UID of the restaurant',
    example: 'rest_12345',
  })
  createDefault(@Param('uid') uid: string): Promise<OperationalHour[]> {
    return this.operationalHoursService.createDefaultHours(uid);
  }

  /**
   * ✅ Replace or update all operational hours manually
   */
  @Post('restaurant/:uid')
  @ApiParam({
    name: 'uid',
    description: 'Unique UID of the restaurant',
    example: 'rest_12345',
  })
  @ApiBody({
    type: [OperationalHour],
    description: 'Array of operational hours to replace or update',
    examples: {
      example: {
        summary: 'Sample operational hours',
        value: [
          { day: 'Mon', enabled: true, from: '09:00', to: '18:00' },
          { day: 'Tue', enabled: true, from: '09:00', to: '18:00' },
        ],
      },
    },
  })
  upsertHours(
    @Param('uid') uid: string,
    @Body() hours: Partial<OperationalHour>[],
  ): Promise<OperationalHour[]> {
    return this.operationalHoursService.upsertHours(uid, hours);
  }

  /**
   * ✅ Get all operational hours for a restaurant
   */
  @Get('restaurant/:uid')
  @ApiParam({
    name: 'uid',
    description: 'Restaurant UID',
    example: 'rest_12345',
  })
  getByRestaurant(@Param('uid') uid: string): Promise<OperationalHour[]> {
    return this.operationalHoursService.getHoursByRestaurant(uid);
  }

  /**
   * ✅ Update one specific day's timing
   */
  @Patch('restaurant/:uid/day/:day')
  @ApiParam({ name: 'uid', description: 'Restaurant UID', example: 'rest_12345' })
  @ApiParam({ name: 'day', description: 'Day of the week', example: 'Mon' })
  updateSingleDay(
    @Param('uid') uid: string,
    @Param('day') day: string,
    @Body() body: Partial<OperationalHour>,
  ): Promise<OperationalHour> {
    return this.operationalHoursService.updateSingleDay(uid, day, body);
  }

  /**
   * ✅ Delete all operational hours for a restaurant
   */
  @Delete('restaurant/:uid')
  @ApiParam({
    name: 'uid',
    description: 'Restaurant UID',
    example: 'rest_12345',
  })
  deleteByRestaurant(@Param('uid') uid: string): Promise<void> {
    return this.operationalHoursService.deleteByRestaurant(uid);
  }
}
