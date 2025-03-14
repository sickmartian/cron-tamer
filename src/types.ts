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
  key: string;
  scheduleId: string;
  scheduleName: string;
  start: Date;
  duration: number; // Duration in minutes
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

export interface DayGrid {
  date: Date;
  timeSlots: TimeSlot[];
} 