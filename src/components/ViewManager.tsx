import { useState } from "react";
import { CalendarView } from "./CalendarView";
import { DetailedDayView } from "./DetailedDayView";
import { DateTime } from "luxon";
import { TimeSlot } from "../types";

interface CalendarManagerProps {
  timezone: string;
  projectionTimezone: string;
  timeSlots: TimeSlot[];
  uCurrentDate: Date;
  setUCurrentDate: (date: Date) => void;
}

/**
 * ViewManager is a component that manages the state and transitions between
 * the calendar view and the detailed day view
 */
export function ViewManager({
  timezone,
  projectionTimezone,
  timeSlots,
  uCurrentDate,
  setUCurrentDate,
}: CalendarManagerProps) {
  const [selectedDay, setSelectedDay] = useState<DateTime | null>(null);

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
        <CalendarView
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
