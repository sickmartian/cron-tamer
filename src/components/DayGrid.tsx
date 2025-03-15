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
  isCollision?: boolean;
  collidingSlots?: Array<{
    scheduleName: string;
    startTime: string;
  }>;
}

interface CollisionData {
  startSeconds: number;
  endSeconds: number;
  collidingSlots: Array<{
    scheduleName: string;
    startTime: string;
  }>;
}

// Safe ISO string function to avoid null
const safeToISOString = (dateTime: DateTime): string => {
  const iso = dateTime.toISO();
  return iso ? iso : dateTime.toString();
};

export function DayGrid({
  timeSlots,
  currentDayStart,
  schedules,
  selectedSlot,
  onSlotSelect,
  isDetailedView = false
}: DayGridProps) {
  const getSlotStyle = (slot: TimeSlot, isCollision = false) => {
    if (isCollision) {
      return { backgroundColor: "#EF4444" }; // Red color for collisions
    }
    
    const schedule = schedules.find((s) => s.id === slot.scheduleId);
    if (!schedule) return { backgroundColor: "#9CA3AF" };
    return { backgroundColor: schedule.color };
  };

  // Pre-calculate all bars for all slots and handle collisions
  const slotBars = useMemo(() => {
    // First, calculate the regular bars
    const regularBars: SlotBar[] = [];

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

        regularBars.push({
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

    // Find collisions for each hour
    const collisionsByHour: Record<number, CollisionData[]> = {};
    
    // Group bars by hour
    const barsByHour: Record<number, SlotBar[]> = {};
    regularBars.forEach(bar => {
      if (!barsByHour[bar.row]) barsByHour[bar.row] = [];
      barsByHour[bar.row].push(bar);
    });
    
    // Detect collisions in each hour
    Object.keys(barsByHour).forEach(hourStr => {
      const hour = parseInt(hourStr);
      const hourBars = barsByHour[hour];
      collisionsByHour[hour] = [];
      
      // Sort by start time
      hourBars.sort((a, b) => a.startSeconds - b.startSeconds);
      
      // Check each pair of bars for overlap
      for (let i = 0; i < hourBars.length; i++) {
        const bar1 = hourBars[i];
        const bar1End = bar1.startSeconds + bar1.durationSeconds;
        
        for (let j = i + 1; j < hourBars.length; j++) {
          const bar2 = hourBars[j];
          const bar2End = bar2.startSeconds + bar2.durationSeconds;
          
          // Check if they overlap
          if (bar1End > bar2.startSeconds && bar2End > bar1.startSeconds) {
            // They overlap - calculate the overlap region
            const overlapStart = Math.max(bar1.startSeconds, bar2.startSeconds);
            const overlapEnd = Math.min(bar1End, bar2End);
            
            // Check if this collision overlaps with any existing collision
            let foundExistingCollision = false;
            for (const collision of collisionsByHour[hour]) {
              if (overlapEnd > collision.startSeconds && collision.endSeconds > overlapStart) {
                // They overlap - merge
                collision.startSeconds = Math.min(collision.startSeconds, overlapStart);
                collision.endSeconds = Math.max(collision.endSeconds, overlapEnd);
                
                // Add bar1 slot if not already included
                if (!collision.collidingSlots.some(s => 
                    s.scheduleName === bar1.slot.scheduleName && 
                    s.startTime === safeToISOString(bar1.slot.start))) {
                  collision.collidingSlots.push({
                    scheduleName: bar1.slot.scheduleName,
                    startTime: safeToISOString(bar1.slot.start)
                  });
                }
                
                // Add bar2 slot if not already included
                if (!collision.collidingSlots.some(s => 
                    s.scheduleName === bar2.slot.scheduleName && 
                    s.startTime === safeToISOString(bar2.slot.start))) {
                  collision.collidingSlots.push({
                    scheduleName: bar2.slot.scheduleName,
                    startTime: safeToISOString(bar2.slot.start)
                  });
                }
                
                foundExistingCollision = true;
                break;
              }
            }
            
            // Create a new collision if not merged with an existing one
            if (!foundExistingCollision) {
              collisionsByHour[hour].push({
                startSeconds: overlapStart,
                endSeconds: overlapEnd,
                collidingSlots: [
                  {
                    scheduleName: bar1.slot.scheduleName,
                    startTime: safeToISOString(bar1.slot.start)
                  },
                  {
                    scheduleName: bar2.slot.scheduleName,
                    startTime: safeToISOString(bar2.slot.start)
                  }
                ]
              });
            }
          }
        }
      }
    });

    // Now create final bars with collisions split out
    const finalBars: SlotBar[] = [];
    
    regularBars.forEach(bar => {
      const hour = bar.row;
      const barEnd = bar.startSeconds + bar.durationSeconds;
      
      if (!collisionsByHour[hour] || collisionsByHour[hour].length === 0) {
        // No collisions in this hour, add the original bar
        finalBars.push(bar);
        return;
      }
      
      // Find all collisions that affect this bar
      const affectingCollisions = collisionsByHour[hour].filter(collision => 
        collision.endSeconds > bar.startSeconds && barEnd > collision.startSeconds &&
        collision.collidingSlots.some(s => 
          s.scheduleName === bar.slot.scheduleName && 
          s.startTime === safeToISOString(bar.slot.start)
        )
      );
      
      if (affectingCollisions.length === 0) {
        // No collisions for this specific bar
        finalBars.push(bar);
        return;
      }
      
      // Sort collisions by start time
      affectingCollisions.sort((a, b) => a.startSeconds - b.startSeconds);
      
      let currentPosition = bar.startSeconds;
      
      // Create segments for the bar, handling each collision
      for (const collision of affectingCollisions) {
        if (currentPosition < collision.startSeconds) {
          // Add non-colliding segment before this collision
          finalBars.push({
            ...bar,
            startSeconds: currentPosition,
            durationSeconds: collision.startSeconds - currentPosition
          });
        }
        
        // Add the collision segment
        finalBars.push({
          ...bar,
          startSeconds: collision.startSeconds,
          durationSeconds: collision.endSeconds - collision.startSeconds,
          isCollision: true,
          collidingSlots: collision.collidingSlots
        });
        
        currentPosition = collision.endSeconds;
      }
      
      // Add any remaining non-colliding segment after the last collision
      if (currentPosition < barEnd) {
        finalBars.push({
          ...bar,
          startSeconds: currentPosition,
          durationSeconds: barEnd - currentPosition
        });
      }
    });

    // Sort bars by start time
    return finalBars.sort((a, b) => {
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

  // Generate collision description
  const getCollisionTitle = (bar: SlotBar) => {
    if (!bar.isCollision || !bar.collidingSlots) return "";
    
    const schedulesInfo = bar.collidingSlots.map(s => {
      try {
        const date = new Date(s.startTime);
        return `${s.scheduleName} (${date.toLocaleTimeString()})`;
      } catch (e) {
        return s.scheduleName;
      }
    }).join(", ");
    
    // Format start and end times for the collision itself
    let startTimeStr = "";
    let endTimeStr = "";
    
    try {
      // Extract hours/minutes/seconds from the seconds count
      const startHour = Math.floor(bar.startSeconds / 3600);
      const startMinutes = Math.floor((bar.startSeconds % 3600) / 60);
      const startSeconds = bar.startSeconds % 60;
      startTimeStr = `${startHour.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}:${startSeconds.toString().padStart(2, '0')}`;
      
      const endSeconds = bar.startSeconds + bar.durationSeconds;
      const endHour = Math.floor(endSeconds / 3600);
      const endMinutes = Math.floor((endSeconds % 3600) / 60);
      const endSecs = endSeconds % 60;
      endTimeStr = `${endHour.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:${endSecs.toString().padStart(2, '0')}`;
    } catch (e) {
      startTimeStr = "unknown";
      endTimeStr = "unknown";
    }
    
    return `COLLISION: ${schedulesInfo} (${startTimeStr} - ${endTimeStr})`;
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
                  key={`${bar.slot.key}-${bar.row}-${bar.startSeconds}`}
                  className={`absolute ${barHeight} cursor-pointer ${
                    selectedSlot?.key === bar.slot.key && !bar.isCollision
                      ? "ring-2 ring-blue-500 dark:ring-blue-400"
                      : ""
                  } ${isDetailedView ? "flex items-center justify-center" : ""} ${
                    bar.isCollision ? "border border-yellow-300 z-20" : ""
                  }`}
                  style={{
                    ...getSlotStyle(bar.slot, bar.isCollision),
                    width: `${widthPercent}%`,
                    left: `${startPercent}%`,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: bar.isCollision ? 20 : 10
                  }}
                  title={bar.isCollision ? getCollisionTitle(bar) : `${
                    bar.slot.scheduleName
                  } - ${bar.slot.start.toLocaleString(DateTime.DATETIME_SHORT)} (${
                    bar.slot.duration
                  } minutes)`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!bar.isCollision) {
                      onSlotSelect(bar.slot);
                    }
                  }}
                >
                  {isDetailedView && widthPercent > 20 && !bar.isCollision && (
                    <span className="text-xs text-white font-medium truncate px-1">
                      {bar.slot.scheduleName}
                    </span>
                  )}
                  {isDetailedView && widthPercent > 30 && bar.isCollision && (
                    <span className="text-xs text-white font-bold truncate px-1">
                      COLLISION
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
