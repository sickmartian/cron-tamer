import { useState, useEffect, useMemo } from "react";
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DateTime | null>(null);

  // Track the currently displayed month to detect changes
  const [displayedMonth, setDisplayedMonth] = useState({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth(),
  });

  // Generate the time slots whenever the schedules, timezone, or displayed month changes
  const timeSlots = useMemo(() => {
    return generateTimeSlotsForMonth(schedules, currentDate, timezone);
  }, [schedules, timezone, displayedMonth, currentDate]);

  // Update displayed month when currentDate changes
  useEffect(() => {
    setDisplayedMonth({
      year: currentDate.getFullYear(),
      month: currentDate.getMonth(),
    });
  }, [currentDate]);

  // Handle setting a new currentDate, ensuring it updates when changing months
  const handleSetCurrentDate = (date: Date) => {
    // Check if the month has changed
    if (
      date.getMonth() !== currentDate.getMonth() ||
      date.getFullYear() !== currentDate.getFullYear()
    ) {
      // Update the current date which will trigger the displayedMonth update
      setCurrentDate(date);
    } else {
      setCurrentDate(date);
    }
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
          schedules={schedules}
          projectionTimezone={projectionTimezone}
          timezone={timezone}
          onBackToCalendar={handleBackToCalendar}
          onPrevDay={handlePrevDay}
          onNextDay={handleNextDay}
          />
      ) : (
        <Calendar
          schedules={schedules}
          timezone={timezone}
          projectionTimezone={projectionTimezone}
          currentDate={currentDate}
          timeSlots={timeSlots}
          setCurrentDate={handleSetCurrentDate}
          onDaySelect={handleDaySelect}
        />
      )}
    </div>
  );
}
