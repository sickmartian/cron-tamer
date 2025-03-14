import { useState } from "react";
import { CronSchedule, TimeSlot } from "../types";
import { generateTimeSlots } from "../utils";
import { DayGrid } from "./DayGrid";
import { DateTime, Interval } from "luxon";

interface CalendarProps {
  schedules: CronSchedule[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
  timezone: string;
  projectionTimezone: string;
}

export function Calendar({
  schedules,
  selectedSlot,
  onSlotSelect,
  timezone,
  projectionTimezone,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const timeSlots = generateTimeSlots(schedules, currentDate, timezone);

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
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
            className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Previous
          </button>
          <button
            onClick={handleNextMonth}
            className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            Next
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
          <div key={`empty-${i}`} className="bg-white dark:bg-gray-800" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          // get the user's current day for the calendar month we are looking at
          const currentDayStart = DateTime.fromJSDate(currentDate)
            .set({ day: i + 1, hour: 0, minute: 0, second: 0, millisecond: 0 })
            .setZone(projectionTimezone, { keepLocalTime: true });
          let slots = timeSlots;
          if (projectionTimezone !== timezone) {
            slots = timeSlots.map((slot) => {
              slot.start = slot.start.setZone(projectionTimezone);
              return slot;
            });
          }
          const daySlots = slots.filter((slot) => {
            return Interval.fromDateTimes(
              currentDayStart,
              currentDayStart.endOf("day")
            ).intersection(
              Interval.fromDateTimes(
                slot.start,
                slot.start.plus({ minutes: slot.duration })
              )
            );
          });

          return (
            <div
              key={i}
              className="min-h-[200px] bg-white dark:bg-gray-800 p-2"
            >
              <div className="text-sm font-medium mb-2 text-gray-900 dark:text-white">
                {i + 1}
              </div>
              <DayGrid
                timeSlots={daySlots}
                currentDayStart={currentDayStart}
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
