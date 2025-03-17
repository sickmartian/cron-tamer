import { useMemo, useEffect } from "react";
import { CronSchedule, TimeSlot } from "../types";
import { DateTime, Interval } from "luxon";
import { DayGrid } from "./DayGrid";
import { ChevronLeftIcon, ChevronRightIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface DetailedDayViewProps {
  timeSlots: TimeSlot[];
  currentDayStart: DateTime;
  schedules: CronSchedule[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
  onBackToCalendar: () => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  timezone: string;
  projectionTimezone: string;
}

export function DetailedDayView({
  timeSlots,
  currentDayStart,
  schedules,
  selectedSlot,
  onSlotSelect,
  onBackToCalendar,
  onPrevDay,
  onNextDay,
  timezone,
  projectionTimezone,
}: DetailedDayViewProps) {
  // Add escape key handler
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onBackToCalendar();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onBackToCalendar]);

  // Filter time slots for the current day
  const { daySlots, projectedDay } = useMemo(() => {
    let slots = timeSlots;
    if (projectionTimezone !== timezone) {
      slots = timeSlots.map((slot) => {
        const newSlot = { ...slot };
        newSlot.start = slot.start.setZone(projectionTimezone);
        return newSlot;
      });
    }

    const projectedDay = currentDayStart
      .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
      .setZone(projectionTimezone, { keepLocalTime: true });

    const currentDayInterval = Interval.fromDateTimes(
      projectedDay,
      projectedDay.endOf("day")
    );

    return {
      daySlots: slots.filter((slot) => {
        const slotInterval = Interval.fromDateTimes(
          slot.start,
          slot.start.plus({ minutes: slot.duration })
        );

        // Check if there's an intersection between the day interval and the slot interval
        return currentDayInterval.intersection(slotInterval);
      }),
      projectedDay: projectedDay,
    };
  }, [timeSlots, currentDayStart, timezone, projectionTimezone]);

  // Format date for display
  const formattedDate = currentDayStart.toLocaleString({
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {formattedDate}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={onPrevDay}
            className="p-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            aria-label="Previous day"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onNextDay}
            className="p-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            aria-label="Next day"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
          <button
            onClick={onBackToCalendar}
            className="p-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            aria-label="Back to calendar"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Hour labels on the left */}
        <div className="w-12 bg-gray-100 dark:bg-gray-700">
          <div
            key="extra-space"
            className="h-8 flex items-center justify-center text-xs border-b border-gray-200 dark:border-gray-700 font-medium text-gray-500 dark:text-gray-400"
          ></div>
          {Array.from({ length: 24 }, (_, hour) => (
            <div
              key={hour}
              className="h-10 flex items-center justify-center text-xs border-b border-gray-200 dark:border-gray-700 font-medium text-gray-500 dark:text-gray-400"
            >
              {hour}:00
            </div>
          ))}
        </div>

        {/* Main content area with minute columns and DayGrid */}
        <div className="flex-1">
          {/* Minute range headers */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            {["0-9", "10-19", "20-29", "30-39", "40-49", "50-59"].map(
              (range) => (
                <div
                  key={range}
                  className="flex-1 px-1 py-2 text-xs text-center font-medium text-gray-500 dark:text-gray-400"
                >
                  {range}
                </div>
              )
            )}
          </div>

          {/* DayGrid with expanded height for detailed view */}
          <div className="h-[600px]">
            <DayGrid
              timeSlots={daySlots}
              pCurrentDayStart={projectedDay}
              schedules={schedules}
              selectedSlot={selectedSlot}
              onSlotSelect={onSlotSelect}
              isDetailedView={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
