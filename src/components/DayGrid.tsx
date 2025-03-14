import { useMemo } from "react";
import { TimeSlot, CronSchedule } from "../types";

interface DayGridProps {
  timeSlots: TimeSlot[];
  schedules: CronSchedule[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
}

interface SlotBar {
  slot: TimeSlot;
  row: number;
  startSeconds: number;
  durationSeconds: number;
}

export function DayGrid({
  timeSlots,
  schedules,
  selectedSlot,
  onSlotSelect
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
      // Convert start time to selected timezone
      const startSeconds = slot.start.minute * 60 + slot.start.second;
      const durationSeconds = slot.duration * 60;

      // Calculate how many hours this slot spans
      let remainingDuration = durationSeconds;
      let currentHour = slot.start.hour;
      let currentStartSeconds = startSeconds;

      while (remainingDuration > 0 && currentHour < 24) {
        // Calculate how many seconds remain in current hour
        const secondsInCurrentHour = 3600 - currentStartSeconds;

        // Duration for this hour's bar is the minimum of remaining duration
        // and seconds left in the hour
        const barDuration = Math.min(remainingDuration, secondsInCurrentHour);

        bars.push({
          slot,
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
  }, [timeSlots]);

  return (
    <div className="grid grid-cols-1 gap-0.5 bg-gray-100 dark:bg-gray-700">
      {Array.from({ length: 24 }, (_, hour) => {
        // Find any bars that should be rendered in this hour
        const bars = slotBars.filter((bar) => bar.row === hour);

        return (
          <div key={hour} className="h-1 bg-white dark:bg-gray-800 relative">
            {bars.map((bar) => {
              // Calculate position and width as percentages of the hour
              const startPercent = (bar.startSeconds / 3600) * 100;
              const widthPercent = (bar.durationSeconds / 3600) * 100;

              return (
                <div
                  key={`${bar.slot.key}-${bar.row}`}
                  className={`absolute h-1 cursor-pointer ${
                    selectedSlot?.key === bar.slot.key
                      ? "ring-2 ring-blue-500 dark:ring-blue-400"
                      : ""
                  }`}
                  style={{
                    ...getSlotStyle(bar.slot),
                    width: `${widthPercent}%`,
                    left: `${startPercent}%`,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                  title={`${
                    bar.slot.scheduleName
                  } - ${bar.slot.start.toString()} (${
                    bar.slot.duration
                  } minutes)`}
                  onClick={() => onSlotSelect(bar.slot)}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
