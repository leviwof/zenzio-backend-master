import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserType } from '../fcm-token.entity';

export class RegisterTokenDto {
  @ApiProperty({ description: 'FCM token from the device' })
  @IsString()
  token: string;

  @ApiPropertyOptional({ description: 'Unique device identifier' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ enum: ['android', 'ios'], default: 'android' })
  @IsOptional()
  @IsString()
  platform?: string;
}

export class SendNotificationDto {
  @ApiProperty({ description: 'User type to send notification to' })
  @IsEnum(UserType)
  userType: UserType;

  @ApiProperty({ description: 'User ID (uid) to send notification to' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification body' })
  @IsString()
  body: string;

  @ApiPropertyOptional({ description: 'Additional data payload' })
  @IsOptional()
  data?: Record<string, string>;
}
