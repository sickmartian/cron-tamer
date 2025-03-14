import { DateTime } from "luxon";
import { CronSchedule, TimeSlot } from "./types";
import { parseExpression } from "cron-parser";

const COLORS = [
  "#FFD700",
  "#4682B4",
  "#8B4513",
  "#CCCCFF",
  "#98FB98",
  "#00FFFF",
];

export function generateColor(index: number): string {
  return COLORS[index % COLORS.length];
}

export function parseCronExpression(
  expression: string,
  targetDate: Date = new Date(),
  timezone: string = "UTC"
): DateTime[] {
  // This is a workaround to avoid the behavior in cron-parser
  // that is not taking into account the current date 'edge' when cron expression is 0 0 1 * *
  // and current date is the first day of the month
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
    .minus({ millisecond: 1 })
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
    currentDate: almostCurrentDate, //`${targetDate.getFullYear()}-${paddedMonth}-01T00:00:00`,
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
