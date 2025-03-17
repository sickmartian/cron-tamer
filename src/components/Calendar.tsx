import { CronSchedule, TimeSlot } from "../types";
import { DayGrid } from "./DayGrid";
import { DateTime, Interval } from "luxon";
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface CalendarProps {
  schedules: CronSchedule[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
  timezone: string;
  projectionTimezone: string;
  onDaySelect: (day: DateTime) => void;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  timeSlots: TimeSlot[];
}

export function Calendar({
  schedules,
  selectedSlot,
  onSlotSelect,
  timezone,
  projectionTimezone,
  onDaySelect,
  currentDate,
  setCurrentDate,
  timeSlots,
}: CalendarProps) {
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();
  const monthName = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {monthName}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            aria-label="Next month"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-100 dark:bg-gray-700">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="p-2 text-sm font-medium text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800"
          >
            {day}
          </div>
        ))}
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`}  />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          // get the user's current day for the calendar month we are looking at
          const currentDayStart = DateTime.fromJSDate(currentDate)
            .set({ day: i + 1, hour: 0, minute: 0, second: 0, millisecond: 0 })
            .setZone(projectionTimezone, { keepLocalTime: true });
          
          // Create a day interval for filtering
          const dayInterval = Interval.fromDateTimes(
            currentDayStart,
            currentDayStart.endOf("day")
          );
          
          // Convert time slots to the right timezone if needed
          let slots = timeSlots;
          if (projectionTimezone !== timezone) {
            slots = timeSlots.map((slot) => {
              const newSlot = { ...slot };
              newSlot.start = slot.start.setZone(projectionTimezone);
              return newSlot;
            });
          }
          
          // Filter slots that intersect with this day
          const daySlots = slots.filter((slot) => {
            const slotInterval = Interval.fromDateTimes(
              slot.start,
              slot.start.plus({ minutes: slot.duration })
            );
            return dayInterval.intersection(slotInterval);
          });

          return (
            <div
              key={i}
              className={`min-h-[200px] bg-white dark:bg-gray-800 p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                currentDayStart.hasSame(DateTime.now().setZone(projectionTimezone), 'day') 
                ? 'ring-2 ring-blue-500 dark:ring-blue-400' 
                : ''
              }`}
              onClick={() => onDaySelect(currentDayStart)}
            >
              <div className={`text-sm font-medium mb-2 ${
                currentDayStart.hasSame(DateTime.now().setZone(projectionTimezone), 'day')
                ? 'text-blue-500 dark:text-blue-400'
                : 'text-gray-900 dark:text-white'
              }`}>
                {i + 1}
              </div>
              <DayGrid
                timeSlots={daySlots}
                pCurrentDayStart={currentDayStart}
                schedules={schedules}
                selectedSlot={selectedSlot}
                onSlotSelect={onSlotSelect}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
