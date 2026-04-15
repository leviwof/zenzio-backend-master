import { IsEnum, IsNotEmpty, IsString, IsOptional } from 'class-validator';

// ---------------------------------------------
// EVENT TYPES
// ---------------------------------------------
export enum AttendanceEventType {
  PUNCH_IN = 'PUNCH_IN',
  PUNCH_OUT = 'PUNCH_OUT',
  BREAK_START = 'BREAK_START',
  BREAK_END = 'BREAK_END',
}

// ---------------------------------------------
// DTO for Punch / Break Events
// ---------------------------------------------
export class PunchDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  fleet_uid: string;

  @IsEnum(AttendanceEventType)
  event_type: AttendanceEventType;
}

// ---------------------------------------------
// INTERFACES FOR JSON LOGS
// ---------------------------------------------

export interface AttendanceEventLog {
  type: AttendanceEventType; // STRICT enum type
  time: string;
}

export interface AttendanceLogs {
  events: AttendanceEventLog[];
}
