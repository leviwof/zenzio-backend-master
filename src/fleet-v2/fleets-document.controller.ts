import { Body, Controller, Get, Post, Patch, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import { WorkingHoursService } from './working-hours.service';
// import { WorkingHour } from './entity/working-hour.entity';
import { WorkingHour } from './entity/working-hour.entity';
@ApiTags('Fleet Operational Hours')
@Controller('operational-hours')
export class WorkingHoursController {
  constructor(private readonly operationalHoursService: WorkingHoursService) {}

  /**
   * ✅ Create default operational hours for a fleet
   */
  @Post('fleet/:uid/default')
  @ApiParam({
    name: 'uid',
    description: 'Unique UID of the fleet',
    example: 'rest_12345',
  })
  createDefault(@Param('uid') uid: string): Promise<WorkingHour[]> {
    return this.operationalHoursService.createDefaultHours(uid);
  }

  /**
   * ✅ Replace or update all operational hours manually
   */
  @Post('fleet/:uid')
  @ApiParam({
    name: 'uid',
    description: 'Unique UID of the fleet',
    example: 'rest_12345',
  })
  @ApiBody({
    type: [WorkingHour],
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
    @Body() hours: Partial<WorkingHour>[],
  ): Promise<WorkingHour[]> {
    return this.operationalHoursService.upsertHours(uid, hours);
  }

  /**
   * ✅ Get all operational hours for a fleet
   */
  @Get('fleet/:uid')
  @ApiParam({
    name: 'uid',
    description: 'Fleet UID',
    example: 'rest_12345',
  })
  getByRestaurant(@Param('uid') uid: string): Promise<WorkingHour[]> {
    return this.operationalHoursService.getHoursByRestaurant(uid);
  }

  /**
   * ✅ Update one specific day's timing
   */
  @Patch('fleet/:uid/day/:day')
  @ApiParam({ name: 'uid', description: 'Fleet UID', example: 'rest_12345' })
  @ApiParam({ name: 'day', description: 'Day of the week', example: 'Mon' })
  updateSingleDay(
    @Param('uid') uid: string,
    @Param('day') day: string,
    @Body() body: Partial<WorkingHour>,
  ): Promise<WorkingHour> {
    return this.operationalHoursService.updateSingleDay(uid, day, body);
  }

  /**
   * ✅ Delete all operational hours for a fleet
   */
  @Delete('fleet/:uid')
  @ApiParam({
    name: 'uid',
    description: 'Fleet UID',
    example: 'rest_12345',
  })
  deleteByRestaurant(@Param('uid') uid: string): Promise<void> {
    return this.operationalHoursService.deleteByRestaurant(uid);
  }
}
