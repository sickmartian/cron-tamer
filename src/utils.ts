import { CronSchedule, TimeSlot } from './types';
import { parseExpression } from 'cron-parser';

const COLORS = [
  '#FF6B6B', // red
  '#4ECDC4', // teal
  '#45B7D1', // blue
  '#96CEB4', // green
  '#FFEEAD', // yellow
  '#D4A5A5', // pink
  '#9B59B6', // purple
  '#3498DB', // blue
  '#E67E22', // orange
  '#2ECC71', // green
];

export function generateColor(index: number): string {
  return COLORS[index % COLORS.length];
}

export function parseCronExpression(
  expression: string,
  targetDate: Date = new Date(),
  timezone: string = 'UTC'
): Date[] {
  try {
    const paddedMonth = targetDate.getMonth() + 1 < 10 ? `0${targetDate.getMonth() + 1}` : targetDate.getMonth() + 1;
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
    const paddedEndOfMonthDay = endOfMonth.getDate() < 10 ? `0${endOfMonth.getDate()}` : endOfMonth.getDate();
    const options = {
      currentDate: `${targetDate.getFullYear()}-${paddedMonth}-01T00:00:00`,
      tz: timezone,
      endDate: `${endOfMonth.getFullYear()}-${paddedMonth}-${paddedEndOfMonthDay}T23:59:59`,
    };
    
    const interval = parseExpression(expression, options);
    const occurrences: Date[] = [];
    
    try {
      let current = interval.next();
      while (true) {
        occurrences.push(current.toDate());
        current = interval.next();
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // This is expected when we reach the end of the month
      // The occurrences array will contain all valid dates up to that point
    }
    
    return occurrences;
  } catch (error) {
    console.error('Error parsing cron expression:', error);
    return [];
  }
}

export function generateTimeSlots(
  schedules: CronSchedule[],
  targetDate: Date,
  timezone: string = 'UTC'
): TimeSlot[] {
  const timeSlots: TimeSlot[] = [];

  schedules.forEach((schedule) => {
    if (!schedule.isActive) return;

    const occurrences = parseCronExpression(schedule.expression, targetDate, timezone);
    
    occurrences.forEach((start) => {
      timeSlots.push({
        start,
        duration: schedule.duration,
        scheduleId: schedule.id,
        scheduleName: schedule.name,
        key: `${schedule.id}-${start.getTime()}`
      });
    });
  });

  return timeSlots.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function getTimeSlotKey(scheduleId: string, startTime: Date): string {
  return `${scheduleId}-${startTime.getTime()}`;
} 