export interface Schedule {
  id: string;
  name: string;
  cronExpression: string;
  duration: number;
  isActive: boolean;
  timezone: string;
}

export interface ScheduleFormProps {
  onSubmit: (schedule: Schedule) => void;
  onDelete: (id: string) => void;
  schedules: Schedule[];
}

export interface TimeSlot {
  start: Date;
  duration: number; // in minutes
  scheduleId: string;
  scheduleName: string;
  isCollision: boolean;
  isSelfCollision: boolean;
  key: string;
  positions: number; // number of grid positions this slot should take
}

export interface CalendarProps {
  schedules: Schedule[];
  onTimeSlotClick: (slot: TimeSlot) => void;
  selectedSlot: TimeSlot | null;
}

export interface CronSchedule {
  id: string;
  name: string;
  expression: string;
  duration: number; // in minutes
  isActive: boolean;
  color: string;
}

export interface GridConfig {
  stepSize: number; // minutes between grid columns
  timezone: string;
}

export interface Collision {
  schedules: CronSchedule[];
  timeSlot: TimeSlot;
}

export interface DayGrid {
  date: Date;
  timeSlots: TimeSlot[];
} 