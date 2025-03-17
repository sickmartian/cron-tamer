import { DateTime } from "luxon";
import { CronSchedule, TimeSlot } from "./types";
import { parseExpression } from "cron-parser";

export const TIME_UPDATE_FREQUENCY_MS = 1000;

// Colors from Reasonable Colors that work well in both light and dark modes
// Each color has good contrast against white and black backgrounds
export const COLORS = [
  "#0089fc", // blue
  "#00a21f", // green
  "#b98300", // amber
  "#9b70ff", // violet
  "#00999a", // cyan
  "#d57300", // cinnamon
  "#657eff", // indigo
  "#00a05a", // emerald
  "#ff4647", // red
  "#fd4d00", // orange
  "#ff426c", // raspberry
  "#d150ff", // purple
];

// Keep track of used colors to avoid duplicates
let usedColors = new Set<string>();

export function generateColor(index: number): string {
  // Reset used colors if we've used them all
  if (usedColors.size === COLORS.length) {
    usedColors.clear();
  }

  // Find the first unused color
  let color = COLORS[index % COLORS.length];
  let attempts = 0;
  while (usedColors.has(color) && attempts < COLORS.length) {
    index = (index + 1) % COLORS.length;
    color = COLORS[index];
    attempts++;
  }

  // If we somehow can't find an unused color, generate a random one
  if (usedColors.has(color)) {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 65 + Math.floor(Math.random() * 10); // 65-75%
    const lightness = 45 + Math.floor(Math.random() * 10); // 45-55%
    color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  usedColors.add(color);
  return color;
}

// Function to remove a color from used colors when a schedule is deleted
export function releaseColor(color: string) {
  usedColors.delete(color);
}

export function parseCronExpression(
  expression: string,
  targetDate: Date = new Date(),
  timezone: string = "UTC"
): DateTime[] {
  const almostCurrentDate = DateTime.local()
    .set({
      day: 1,
      month: targetDate.getMonth() + 1,
      year: targetDate.getFullYear(),
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    })
    .minus({
      // The millis here is a workaround to avoid the behavior in cron-parser
      // that is not taking into account the current date 'edge' when cron expression is 0 0 1 * *
      // and current date is the first day of the month
      millisecond: 1,
      // the month here is to allow for inter month jobs, we give more than we have to
      month: 1,
    })
    .toFormat("yyyy-MM-dd'T'HH:mm:ss");
  const paddedMonth =
    targetDate.getMonth() + 1 < 10
      ? `0${targetDate.getMonth() + 1}`
      : targetDate.getMonth() + 1;
  const endOfMonth = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth() + 1,
    0
  );
  const paddedEndOfMonthDay =
    endOfMonth.getDate() < 10
      ? `0${endOfMonth.getDate()}`
      : endOfMonth.getDate();
  const options = {
    currentDate: almostCurrentDate,
    tz: timezone,
    endDate: `${endOfMonth.getFullYear()}-${paddedMonth}-${paddedEndOfMonthDay}T23:59:59`,
  };

  const interval = parseExpression(expression, options);
  const occurrences: DateTime[] = [];

  try {
    let current = interval.next();
    while (true) {
      occurrences.push(
        DateTime.fromISO(current.toISOString(), { zone: timezone })
      );
      current = interval.next();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    // This could be an expected when we reach the end of the period
    // The occurrences array will contain all valid dates up to that point
  }

  return occurrences;
}

export function generateTimeSlots(
  schedules: CronSchedule[],
  targetDate: Date,
  timezone: string = "UTC"
): TimeSlot[] {
  const timeSlots: TimeSlot[] = [];

  schedules.forEach((schedule) => {
    if (!schedule.isActive) return;

    const occurrences = parseCronExpression(
      schedule.expression,
      targetDate,
      timezone
    );

    occurrences.forEach((start) => {
      timeSlots.push({
        start,
        duration: schedule.duration,
        scheduleId: schedule.id,
        scheduleName: schedule.name,
        key: `${schedule.id}-${start.toString()}`,
      });
    });
  });

  // Sort by start time
  return timeSlots.sort((a, b) => a.start.toMillis() - b.start.toMillis());
}

export function getTimeSlotKey(scheduleId: string, startTime: Date): string {
  return `${scheduleId}-${startTime.getTime()}`;
}
