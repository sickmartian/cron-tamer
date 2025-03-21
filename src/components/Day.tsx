import { useMemo, useState, useEffect, useRef, memo } from "react";
import { TimeSlot } from "../types";
import { DateTime } from "luxon";
import { TIME_UPDATE_FREQUENCY_MS } from "../utils";

interface DayGridProps {
  timeSlots: TimeSlot[];
  pCurrentDayStart: DateTime;
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

interface PopoverInfo {
  barKey: string;
  title: string;
  position: {
    x: number;
    y: number;
  };
}

// Safe ISO string function to avoid null
const safeToISOString = (dateTime: DateTime): string => {
  const iso = dateTime.toISO();
  return iso ? iso : dateTime.toString();
};

// Format time from seconds
const formatTimeFromSeconds = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

// Add a CSS class or style to handle text scaling
const getTextStyle = (widthPercent: number) => {
  if (widthPercent < 5) {
    return null; // Too small to show text
  } else if (widthPercent < 10) {
    return { fontSize: "0.6rem", letterSpacing: "-0.05em" };
  } else if (widthPercent < 15) {
    return { fontSize: "0.7rem", letterSpacing: "-0.03em" };
  } else if (widthPercent < 20) {
    return { fontSize: "0.75rem" };
  }
  return { fontSize: "0.875rem" }; // Default size (text-sm in Tailwind)
};

/**
 * DayComponent is a component that renders a day of the calendar
 * It can be in two modes:
 * - Calendar mode: shows inside multiple days in the calendar view
 * - Detailed day view: shows inside the selected day in the detailed day view
 * that contains the references to the time (hours and minutes as row and column headers respectively)
 */
function DayComponent({
  timeSlots,
  pCurrentDayStart,
  isDetailedView = false,
}: DayGridProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [popover, setPopover] = useState<PopoverInfo | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState<DateTime>(
    DateTime.now().setZone(pCurrentDayStart.zone)
  );

  // Update current time everynow and then, or when our TZ or day changes
  useEffect(() => {
    setCurrentTime(DateTime.now().setZone(pCurrentDayStart.zone));
    intervalRef.current = setInterval(() => {
      setCurrentTime(DateTime.now().setZone(pCurrentDayStart.zone));
    }, TIME_UPDATE_FREQUENCY_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pCurrentDayStart]);

  // Calculate current time position
  const currentTimePosition = useMemo(() => {
    if (!pCurrentDayStart.hasSame(currentTime, "day")) return null;
    const hour = currentTime.hour;
    const minutePercent = (currentTime.minute / 60) * 100;
    return { hour, position: minutePercent };
  }, [
    currentTime,
    // currentDayStart.zone is the projection timezone
    pCurrentDayStart.zone,
  ]);

  // Close popover when clicking outside
  useEffect(() => {
    // Only add the event listener if the popover is open
    if (!popover) return;

    const handleClickOutside = (event: MouseEvent) => {
      // Check if click was outside the popover
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setPopover(null);
        setSelectedSlot(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popover]); // Only depends on popover state, not on any external state

  // Clear popover when selected slot changes externally
  useEffect(() => {
    if (!selectedSlot) {
      setPopover(null);
    }
  }, [selectedSlot]);

  // Pre-calculate all bars for all slots and handle collisions
  const slotBars = useMemo(() => {
    // First, calculate the regular bars
    const regularBars: SlotBar[] = [];

    timeSlots.forEach((slot) => {
      const adjustedSlot = {
        ...slot,
      };

      if (slot.start < pCurrentDayStart) {
        adjustedSlot.duration -= pCurrentDayStart.diff(
          slot.start,
          "minutes"
        ).minutes;
        adjustedSlot.start = pCurrentDayStart;
      }
      const endDateTime = adjustedSlot.start.plus({
        minutes: adjustedSlot.duration,
      });
      if (!endDateTime.hasSame(pCurrentDayStart, "day")) {
        adjustedSlot.duration = pCurrentDayStart
          .endOf("day")
          .diff(adjustedSlot.start, "minutes").minutes;
      }

      // Convert start time to selected timezone
      const startSeconds =
        adjustedSlot.start.minute * 60 + adjustedSlot.start.second;
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
    regularBars.forEach((bar) => {
      if (!barsByHour[bar.row]) barsByHour[bar.row] = [];
      barsByHour[bar.row].push(bar);
    });

    // Detect collisions in each hour
    Object.keys(barsByHour).forEach((hourStr) => {
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
              if (
                overlapEnd > collision.startSeconds &&
                collision.endSeconds > overlapStart
              ) {
                // They overlap - merge
                collision.startSeconds = Math.min(
                  collision.startSeconds,
                  overlapStart
                );
                collision.endSeconds = Math.max(
                  collision.endSeconds,
                  overlapEnd
                );

                // Add bar1 slot if not already included
                if (
                  !collision.collidingSlots.some(
                    (s) =>
                      s.scheduleName === bar1.slot.scheduleName &&
                      s.startTime === safeToISOString(bar1.slot.start)
                  )
                ) {
                  collision.collidingSlots.push({
                    scheduleName: bar1.slot.scheduleName,
                    startTime: safeToISOString(bar1.slot.start),
                  });
                }

                // Add bar2 slot if not already included
                if (
                  !collision.collidingSlots.some(
                    (s) =>
                      s.scheduleName === bar2.slot.scheduleName &&
                      s.startTime === safeToISOString(bar2.slot.start)
                  )
                ) {
                  collision.collidingSlots.push({
                    scheduleName: bar2.slot.scheduleName,
                    startTime: safeToISOString(bar2.slot.start),
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
                    startTime: safeToISOString(bar1.slot.start),
                  },
                  {
                    scheduleName: bar2.slot.scheduleName,
                    startTime: safeToISOString(bar2.slot.start),
                  },
                ],
              });
            }
          }
        }
      }
    });

    // Now create final bars with collisions split out
    const finalBars: SlotBar[] = [];

    regularBars.forEach((bar) => {
      const hour = bar.row;
      const barEnd = bar.startSeconds + bar.durationSeconds;

      if (!collisionsByHour[hour] || collisionsByHour[hour].length === 0) {
        // No collisions in this hour, add the original bar
        finalBars.push(bar);
        return;
      }

      // Find all collisions that affect this bar
      const affectingCollisions = collisionsByHour[hour].filter(
        (collision) =>
          collision.endSeconds > bar.startSeconds &&
          barEnd > collision.startSeconds &&
          collision.collidingSlots.some(
            (s) =>
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
            durationSeconds: collision.startSeconds - currentPosition,
          });
        }

        // Add the collision segment
        finalBars.push({
          ...bar,
          startSeconds: collision.startSeconds,
          durationSeconds: collision.endSeconds - collision.startSeconds,
          isCollision: true,
          collidingSlots: collision.collidingSlots,
        });

        currentPosition = collision.endSeconds;
      }

      // Add any remaining non-colliding segment after the last collision
      if (currentPosition < barEnd) {
        finalBars.push({
          ...bar,
          startSeconds: currentPosition,
          durationSeconds: barEnd - currentPosition,
        });
      }
    });

    // Sort bars by start time
    return finalBars.sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.startSeconds - b.startSeconds;
    });
  }, [timeSlots, pCurrentDayStart]);

  const barHeight = isDetailedView ? "h-10" : "h-1";
  const currentTimeMarkerClass = isDetailedView
    ? "absolute w-3 h-3 rounded-full bg-black dark:bg-white ring-2 ring-white dark:ring-black z-30"
    : "absolute w-1 h-1 rounded-full bg-black dark:bg-white ring-2 ring-white dark:ring-black z-30";
  const containerClass = isDetailedView
    ? "grid grid-cols-1 gap-0 h-full"
    : "grid grid-cols-1 gap-0.5 bg-gray-100 dark:bg-gray-700";

  // Show minute range indicators only in detailed view
  const renderMinuteMarkers = (hour: number) => {
    if (!isDetailedView) return null;

    return (
      <div className="absolute inset-0 flex pointer-events-none">
        {["0-9", "10-19", "20-29", "30-39", "40-49", "50-59"].map(
          (_, index) => (
            <div
              key={`marker-${hour}-${index}`}
              className="flex-1 border-r border-gray-200 dark:border-gray-700 last:border-r-0"
              style={{ left: `${(index / 6) * 100}%`, width: `${100 / 6}%` }}
            />
          )
        )}
      </div>
    );
  };

  // Generate collision description
  const getCollisionTitle = (bar: SlotBar) => {
    if (!bar.isCollision || !bar.collidingSlots) return "";

    // Format all colliding schedules with their start times
    const schedulesInfo = bar.collidingSlots
      .map((s) => {
        try {
          const date = new Date(s.startTime);
          return `${s.scheduleName} - ${date.toLocaleTimeString()}`;
        } catch (e) {
          return `${s.scheduleName} - unknown time`;
        }
      })
      .join("\n");

    // Format start and end times for the collision itself
    let collisionTimeRange = "";
    try {
      const startTimeStr = formatTimeFromSeconds(bar.startSeconds);
      const endTimeStr = formatTimeFromSeconds(
        bar.startSeconds + bar.durationSeconds
      );
      collisionTimeRange = `${startTimeStr} - ${endTimeStr}`;
    } catch (e) {
      collisionTimeRange = "unknown";
    }

    // Put it all together in the requested format
    return `Collision:\n${schedulesInfo}\nCollision Times: ${collisionTimeRange}`;
  };

  // Get the title for a bar
  const getBarTitle = (bar: SlotBar) => {
    if (bar.isCollision) {
      return getCollisionTitle(bar);
    } else {
      return `${bar.slot.scheduleName} - ${bar.slot.start.toLocaleString(
        DateTime.DATETIME_SHORT
      )} (${bar.slot.duration} minutes)`;
    }
  };

  // Handle click on a bar
  const handleBarClick = (
    e: React.MouseEvent,
    bar: SlotBar,
    barKey: string
  ) => {
    e.stopPropagation();

    // Check if this is a toggle (clicking on already selected bar)
    const isToggling = !bar.isCollision && selectedSlot?.key === bar.slot.key;

    if (isToggling) {
      // Unselect the slot
      setSelectedSlot(null as any);
      setPopover(null);
    } else {
      // Only select non-collision bars
      if (!bar.isCollision) {
        setSelectedSlot(bar.slot);
      }

      // Use mouse coordinates for popover positioning
      setPopover({
        barKey,
        title: getBarTitle(bar),
        position: {
          x: e.clientX,
          y: e.clientY,
        },
      });
    }
  };

  return (
    <div className={containerClass} ref={containerRef}>
      {Array.from({ length: 24 }, (_, hour) => {
        // Find any bars that should be rendered in this hour
        const bars = slotBars.filter((bar) => bar.row === hour);

        return (
          <div
            key={hour}
            className={`${barHeight} bg-white dark:bg-gray-800 relative`}
          >
            {renderMinuteMarkers(hour)}
            {currentTimePosition && currentTimePosition.hour === hour && (
              <div
                className={currentTimeMarkerClass}
                style={{
                  left: `${currentTimePosition.position}%`,
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
            )}
            {bars.map((bar) => {
              // Calculate position and width as percentages of the hour
              const startPercent = (bar.startSeconds / 3600) * 100;
              const widthPercent = (bar.durationSeconds / 3600) * 100;

              const barKey = `${bar.slot.key}-${bar.row}-${bar.startSeconds}`;
              const isSelected =
                selectedSlot?.key === bar.slot.key && !bar.isCollision;

              return (
                <div
                  key={barKey}
                  data-bar="true"
                  className={`absolute ${barHeight} cursor-pointer ${
                    isSelected ? "ring-2 ring-blue-500 dark:ring-blue-400" : ""
                  } ${
                    isDetailedView ? "flex items-center justify-center" : ""
                  } ${bar.isCollision ? "border border-yellow-300 z-20" : ""}`}
                  style={{
                    backgroundColor: bar.isCollision
                      ? "#EF4444"
                      : bar.slot.scheduleColor,
                    width: `${widthPercent}%`,
                    left: `${startPercent}%`,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: bar.isCollision ? 20 : 10,
                  }}
                  title={getBarTitle(bar)}
                  onClick={(e) => handleBarClick(e, bar, barKey)}
                >
                  {isDetailedView && (
                    <>
                      {!bar.isCollision &&
                        (() => {
                          const textStyle = getTextStyle(widthPercent);
                          return (
                            textStyle && (
                              <span
                                className="text-white font-medium truncate px-1 select-none"
                                style={textStyle}
                              >
                                {bar.slot.scheduleName}
                              </span>
                            )
                          );
                        })()}
                      {bar.isCollision && widthPercent > 30 && (
                        <span className="text-xs text-white font-bold truncate px-1">
                          COLLISION
                        </span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Popover positioned based on mouse coordinates */}
      {popover && (
        <div
          ref={popoverRef}
          className="fixed z-30 bg-gray-800 text-white text-sm rounded-md p-2 shadow-lg max-w-xs overflow-auto"
          style={{
            top: popover.position.y - 10,
            left: Math.max(0, popover.position.x - 100),
            transform: "translateY(-100%)",
            maxHeight: "300px", // Add max height with scrolling
            minWidth: "220px",
          }}
        >
          <div className="whitespace-pre-wrap break-words">{popover.title}</div>
          <div
            className="absolute w-3 h-3 bg-gray-800 rotate-45 transform"
            style={{
              bottom: "-6px",
              left: "50%",
              marginLeft: "-6px",
            }}
          />
        </div>
      )}
    </div>
  );
}

export const DayGrid = memo(DayComponent);
