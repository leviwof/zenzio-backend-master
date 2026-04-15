import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { MapsService } from './maps.service';
import { GpsPoint } from './utils/speed.util';
import { ApiTags, ApiQuery, ApiBody } from '@nestjs/swagger';

@ApiTags('Maps')
@Controller('maps')
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  // -------------------------
  // GEOCODE
  // -------------------------
  @Get('geocode')
  @ApiQuery({ name: 'address', example: 'Chennai', required: true })
  geocode(@Query('address') address: string) {
    return this.mapsService.geocodeAddress(address);
  }

  // -------------------------
  // REVERSE GEOCODE
  // -------------------------
  @Get('reverse')
  @ApiQuery({ name: 'lat', example: 13.0827, required: true })
  @ApiQuery({ name: 'lng', example: 80.2707, required: true })
  reverse(@Query('lat') lat: string, @Query('lng') lng: string) {
    return this.mapsService.reverseGeocode(+lat, +lng);
  }

  // -------------------------
  // ROUTE
  // -------------------------
  @Get('route')
  @ApiQuery({ name: 'startLat', example: 13.0827 })
  @ApiQuery({ name: 'startLng', example: 80.2707 })
  @ApiQuery({ name: 'endLat', example: 13.05 })
  @ApiQuery({ name: 'endLng', example: 80.25 })
  route(
    @Query('startLat') startLat: string,
    @Query('startLng') startLng: string,
    @Query('endLat') endLat: string,
    @Query('endLng') endLng: string,
  ) {
    return this.mapsService.getRoute([+startLat, +startLng], [+endLat, +endLng]);
  }

  // -------------------------
  // DISTANCE
  // -------------------------
  @Get('distance')
  @ApiQuery({ name: 'startLat', example: 13.0827 })
  @ApiQuery({ name: 'startLng', example: 80.2707 })
  @ApiQuery({ name: 'endLat', example: 13.05 })
  @ApiQuery({ name: 'endLng', example: 80.25 })
  distance(
    @Query('startLat') startLat: string,
    @Query('startLng') startLng: string,
    @Query('endLat') endLat: string,
    @Query('endLng') endLng: string,
  ) {
    return this.mapsService.getDistance([+startLat, +startLng], [+endLat, +endLng]);
  }

  // -------------------------
  // ETA
  // -------------------------
  @Get('eta')
  @ApiQuery({ name: 'startLat', example: 13.0827 })
  @ApiQuery({ name: 'startLng', example: 80.2707 })
  @ApiQuery({ name: 'endLat', example: 13.05 })
  @ApiQuery({ name: 'endLng', example: 80.25 })
  eta(
    @Query('startLat') startLat: string,
    @Query('startLng') startLng: string,
    @Query('endLat') endLat: string,
    @Query('endLng') endLng: string,
  ) {
    return this.mapsService.getEstimatedTime([+startLat, +startLng], [+endLat, +endLng]);
  }

  // -------------------------
  // SPEED ANALYTICS
  // -------------------------
  @Post('speed')
  @ApiBody({
    description: 'GPS points for speed calculation',
    schema: {
      example: [
        { lat: 13.0827, lng: 80.2707, timestamp: 1710675300 },
        { lat: 13.0835, lng: 80.272, timestamp: 1710675360 },
        { lat: 13.085, lng: 80.275, timestamp: 1710675420 },
      ],
    },
  })
  speedAnalytics(@Body() points: GpsPoint[]) {
    return this.mapsService.getSpeedAnalytics(points);
  }

  // -------------------------
  // RADIUS CHECK (5km, 10km etc.)
  // -------------------------
  @Get('radius-check')
  @ApiQuery({ name: 'sourceLat', example: 13.0827 })
  @ApiQuery({ name: 'sourceLng', example: 80.2707 })
  @ApiQuery({ name: 'targetLat', example: 13.05 })
  @ApiQuery({ name: 'targetLng', example: 80.25 })
  @ApiQuery({ name: 'radiusKm', example: 5 })
  radiusCheck(
    @Query('sourceLat') sourceLat: string,
    @Query('sourceLng') sourceLng: string,
    @Query('targetLat') targetLat: string,
    @Query('targetLng') targetLng: string,
    @Query('radiusKm') radiusKm: string,
  ) {
    return this.mapsService.checkRadius(
      [+sourceLat, +sourceLng],
      [+targetLat, +targetLng],
      +radiusKm,
    );
  }
}
