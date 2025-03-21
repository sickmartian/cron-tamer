import { useState, useMemo } from "react";
import { CronSchedule } from "../types";
import { Calendar } from "./Calendar";
import { DetailedDayView } from "./DetailedDayView";
import { generateTimeSlotsForMonth } from "../utils";
import { DateTime } from "luxon";

interface CalendarManagerProps {
  schedules: CronSchedule[];
  timezone: string;
  projectionTimezone: string;
}

export function CalendarManager({
  schedules,
  timezone,
  projectionTimezone,
}: CalendarManagerProps) {
  const [uCurrentDate, setUCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DateTime | null>(null);

  // Generate the time slots whenever the schedules, timezone, or displayed month changes
  const timeSlots = useMemo(() => {
    return generateTimeSlotsForMonth(schedules, uCurrentDate, timezone);
  }, [schedules, timezone, uCurrentDate]);

  const handleSetCurrentDate = (date: Date) => {
    setUCurrentDate(date);
  };

  const handleDaySelect = (date: DateTime) => {
    setSelectedDay(date);
  };

  const handleBackToCalendar = () => {
    setSelectedDay(null);
  };

  const handlePrevDay = () => {
    if (selectedDay) {
      const newDay = selectedDay.minus({ days: 1 });
      setSelectedDay(newDay);

      // Check if we crossed into a different month
      if (
        newDay.month !== selectedDay.month ||
        newDay.year !== selectedDay.year
      ) {
        handleSetCurrentDate(newDay.toJSDate());
      }
    }
  };

  const handleNextDay = () => {
    if (selectedDay) {
      const newDay = selectedDay.plus({ days: 1 });
      setSelectedDay(newDay);

      // Check if we crossed into a different month
      if (
        newDay.month !== selectedDay.month ||
        newDay.year !== selectedDay.year
      ) {
        handleSetCurrentDate(newDay.toJSDate());
      }
    }
  };

  return (
    <div>
      {selectedDay ? (
        <DetailedDayView
          timeSlots={timeSlots}
          currentDayStart={selectedDay}
          projectionTimezone={projectionTimezone}
          timezone={timezone}
          onBackToCalendar={handleBackToCalendar}
          onPrevDay={handlePrevDay}
          onNextDay={handleNextDay}
          />
      ) : (
        <Calendar
          timezone={timezone}
          projectionTimezone={projectionTimezone}
          currentDate={uCurrentDate}
          timeSlots={timeSlots}
          setCurrentDate={handleSetCurrentDate}
          onDaySelect={handleDaySelect}
        />
      )}
    </div>
  );
}
