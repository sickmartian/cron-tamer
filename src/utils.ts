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

export function parseCronExpression(expression: string): Date[] {
  try {
    const interval = parseExpression(expression);
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const occurrences: Date[] = [];
    let current = interval.next();
    
    while (current.toDate() <= endOfMonth) {
      occurrences.push(current.toDate());
      current = interval.next();
    }
    
    return occurrences;
  } catch (error) {
    console.error('Error parsing cron expression:', error);
    return [];
  }
}

export function generateTimeSlots(schedules: CronSchedule[]): TimeSlot[] {
  const timeSlots: TimeSlot[] = [];

  schedules.forEach((schedule) => {
    if (!schedule.isActive) return;

    const occurrences = parseCronExpression(schedule.expression);
    
    occurrences.forEach((start) => {
      const end = new Date(start.getTime() + schedule.duration * 60000);
      
      // Check for self-collisions
      const hasSelfCollision = timeSlots.some(
        (slot) =>
          slot.scheduleId === schedule.id &&
          ((start >= slot.start && start < slot.end) ||
            (end > slot.start && end <= slot.end) ||
            (start <= slot.start && end >= slot.end))
      );

      // Check for collisions with other schedules
      const hasCollision = timeSlots.some(
        (slot) =>
          slot.scheduleId !== schedule.id &&
          ((start >= slot.start && start < slot.end) ||
            (end > slot.start && end <= slot.end) ||
            (start <= slot.start && end >= slot.end))
      );

      timeSlots.push({
        start,
        end,
        scheduleId: schedule.id,
        scheduleName: schedule.name,
        isCollision: hasCollision,
        isSelfCollision: hasSelfCollision,
        key: `${schedule.id}-${start.getTime()}`,
      });
    });
  });

  return timeSlots.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function getTimeSlotKey(scheduleId: string, startTime: Date): string {
  return `${scheduleId}-${startTime.getTime()}`;
} 