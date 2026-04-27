export interface Shift {
  id: string;
  name: string;
  start: string;
  end: string;
  workHours: number;
  breakMinutes: number;
  type?: string;
  breakType: 'SPLIT' | 'CONTINUOUS';
}

export const SHIFTS: Shift[] = [
  {
    id: 'MORNING',
    name: 'Morning Shift',
    start: '07:00 AM',
    end: '03:30 PM',
    workHours: 8,
    breakMinutes: 30,
    breakType: 'SPLIT',
  },
  {
    id: 'EVENING',
    name: 'Evening Shift',
    start: '02:30 PM',
    end: '11:00 PM',
    workHours: 8,
    breakMinutes: 30,
    breakType: 'SPLIT',
  },
  {
    id: 'GENERAL',
    name: 'General Shift',
    start: '10:00 AM',
    end: '06:30 PM',
    workHours: 8,
    breakMinutes: 30,
    breakType: 'SPLIT',
  },
  {
    id: 'FULL_TIME_1',
    name: 'Full Time Shift 1',
    start: '07:00 AM',
    end: '07:00 PM',
    workHours: 10,
    breakMinutes: 120,
    breakType: 'CONTINUOUS',
  },
  {
    id: 'FULL_TIME_2',
    name: 'Full Time Shift 2',
    start: '10:00 AM',
    end: '10:00 PM',
    workHours: 10,
    breakMinutes: 120,
    breakType: 'CONTINUOUS',
  },
  {
    id: 'PART_TIME_MORNING',
    name: 'Part Time Morning',
    start: '06:00 AM',
    end: '10:00 AM',
    workHours: 4,
    breakMinutes: 0,
    breakType: 'SPLIT',
  },
  {
    id: 'PART_TIME_EVENING',
    name: 'Part Time Evening',
    start: '06:00 PM',
    end: '10:00 PM',
    workHours: 4,
    breakMinutes: 0,
    breakType: 'SPLIT',
  },
];

export type ShiftId = (typeof SHIFTS)[number]['id'];

export const getShiftById = (id: string): Shift | undefined => {
  return SHIFTS.find((shift) => shift.id === id);
};

export const getShiftConfig = (): Omit<Shift, 'type'>[] => {
  return SHIFTS.map((shift) => ({
    id: shift.id,
    name: shift.name,
    start: shift.start,
    end: shift.end,
    workHours: shift.workHours,
    breakMinutes: shift.breakMinutes,
    breakType: shift.breakType,
  }));
};