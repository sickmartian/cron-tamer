import { useState } from "react";
import { CronSchedule, TimeSlot } from "../types";
import { Calendar } from "./Calendar";
import { DetailedDayView } from "./DetailedDayView";
import { generateTimeSlots } from "../utils";
import { DateTime } from "luxon";

interface CalendarManagerProps {
  schedules: CronSchedule[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
  timezone: string;
  projectionTimezone: string;
}

export function CalendarManager({
  schedules,
  selectedSlot,
  onSlotSelect,
  timezone,
  projectionTimezone,
}: CalendarManagerProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DateTime | null>(null);
  
  // Generate the time slots - will be used by both Calendar and DetailedDayView
  const timeSlots = generateTimeSlots(schedules, currentDate, timezone);
  
  const handleDaySelect = (date: DateTime) => {
    setSelectedDay(date);
  };
  
  const handleBackToCalendar = () => {
    setSelectedDay(null);
  };
  
  const handlePrevDay = () => {
    if (selectedDay) {
      setSelectedDay(selectedDay.minus({ days: 1 }));
    }
  };
  
  const handleNextDay = () => {
    if (selectedDay) {
      setSelectedDay(selectedDay.plus({ days: 1 }));
    }
  };
  
  return (
    <div>
      {selectedDay ? (
        <DetailedDayView
          timeSlots={timeSlots}
          currentDayStart={selectedDay}
          schedules={schedules}
          selectedSlot={selectedSlot}
          onSlotSelect={onSlotSelect}
          onBackToCalendar={handleBackToCalendar}
          onPrevDay={handlePrevDay}
          onNextDay={handleNextDay}
          projectionTimezone={projectionTimezone}
          timezone={timezone}
        />
      ) : (
        <Calendar
          schedules={schedules}
          selectedSlot={selectedSlot}
          onSlotSelect={onSlotSelect}
          timezone={timezone}
          projectionTimezone={projectionTimezone}
          onDaySelect={handleDaySelect}
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          timeSlots={timeSlots}
        />
      )}
    </div>
  );
} 