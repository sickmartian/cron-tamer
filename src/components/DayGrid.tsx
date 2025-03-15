import { useMemo } from "react";
import { TimeSlot, CronSchedule } from "../types";
import { DateTime } from "luxon";

interface DayGridProps {
  timeSlots: TimeSlot[];
  currentDayStart: DateTime;
  schedules: CronSchedule[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
  isDetailedView?: boolean;
}

interface SlotBar {
  slot: TimeSlot;
  row: number;
  startSeconds: number;
  durationSeconds: number;
}

export function DayGrid({
  timeSlots,
  currentDayStart,
  schedules,
  selectedSlot,
  onSlotSelect,
  isDetailedView = false
}: DayGridProps) {
  const getSlotStyle = (slot: TimeSlot) => {
    const schedule = schedules.find((s) => s.id === slot.scheduleId);
    if (!schedule) return { backgroundColor: "#9CA3AF" };
    return { backgroundColor: schedule.color };
  };

  // Pre-calculate all bars for all slots
  const slotBars = useMemo(() => {
    const bars: SlotBar[] = [];

    timeSlots.forEach((slot) => {
      const adjustedSlot = {
        ...slot,
      }

      if (slot.start < currentDayStart) {
        adjustedSlot.duration -= currentDayStart.diff(slot.start, 'minutes').minutes;
        adjustedSlot.start = currentDayStart;
      }
      const endDateTime = adjustedSlot.start.plus({ minutes: adjustedSlot.duration });
      if (!endDateTime.hasSame(currentDayStart, 'day')) {
        adjustedSlot.duration = currentDayStart.endOf('day').diff(adjustedSlot.start, 'minutes').minutes;
      }

      // Convert start time to selected timezone
      const startSeconds = adjustedSlot.start.minute * 60 + adjustedSlot.start.second;
      const durationSeconds = adjustedSlot.duration * 60;

      // Calculate how many hours this slot spans
      let remainingDuration = durationSeconds;
      let currentHour = adjustedSlot.start.hour;
      let currentStartSeconds = startSeconds;

      while (remainingDuration > 0 && currentHour < 24) {
        // Calculate how many seconds remain in current hour
        const secondsInCurrentHour = 3600 - currentStartSeconds;

        // Duration for this hour's bar is the minimum of remaining duration
        // and seconds left in the hour
        const barDuration = Math.min(remainingDuration, secondsInCurrentHour);

        bars.push({
          slot, // original one
          row: currentHour,
          startSeconds: currentStartSeconds,
          durationSeconds: barDuration,
        });

        // Move to next hour
        remainingDuration -= barDuration;
        currentHour++;
        currentStartSeconds = 0; // Start from beginning of next hour
      }
    });

    // Sort bars by start time
    return bars.sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.startSeconds - b.startSeconds;
    });
  }, [timeSlots, currentDayStart]);

  const barHeight = isDetailedView ? "h-10" : "h-1";
  const containerClass = isDetailedView 
    ? "grid grid-cols-1 gap-0 h-full" 
    : "grid grid-cols-1 gap-0.5 bg-gray-100 dark:bg-gray-700";

  // Show minute range indicators only in detailed view
  const renderMinuteMarkers = (hour: number) => {
    if (!isDetailedView) return null;
    
    return (
      <div className="absolute inset-0 flex pointer-events-none">
        {['0-9', '10-19', '20-29', '30-39', '40-49', '50-59'].map((_, index) => (
          <div 
            key={`marker-${hour}-${index}`} 
            className="flex-1 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
            style={{ left: `${(index / 6) * 100}%`, width: `${100/6}%` }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className={containerClass}>
      {Array.from({ length: 24 }, (_, hour) => {
        // Find any bars that should be rendered in this hour
        const bars = slotBars.filter((bar) => bar.row === hour);

        return (
          <div key={hour} className={`${barHeight} bg-white dark:bg-gray-800 relative`}>
            {renderMinuteMarkers(hour)}
            {bars.map((bar) => {
              // Calculate position and width as percentages of the hour
              const startPercent = (bar.startSeconds / 3600) * 100;
              const widthPercent = (bar.durationSeconds / 3600) * 100;

              return (
                <div
                  key={`${bar.slot.key}-${bar.row}`}
                  className={`absolute ${barHeight} cursor-pointer ${
                    selectedSlot?.key === bar.slot.key
                      ? "ring-2 ring-blue-500 dark:ring-blue-400"
                      : ""
                  } ${isDetailedView ? "flex items-center justify-center" : ""}`}
                  style={{
                    ...getSlotStyle(bar.slot),
                    width: `${widthPercent}%`,
                    left: `${startPercent}%`,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 10
                  }}
                  title={`${
                    bar.slot.scheduleName
                  } - ${bar.slot.start.toLocaleString(DateTime.DATETIME_SHORT)} (${
                    bar.slot.duration
                  } minutes)`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSlotSelect(bar.slot);
                  }}
                >
                  {isDetailedView && widthPercent > 20 && (
                    <span className="text-xs text-white font-medium truncate px-1">
                      {bar.slot.scheduleName}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
