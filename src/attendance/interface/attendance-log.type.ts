export interface AttendanceEventLog {
  type: string;
  time: string;
}

export interface AttendanceLogs {
  events: AttendanceEventLog[];
}
