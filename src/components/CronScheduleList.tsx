import { useState, useEffect, useCallback, useRef, memo } from "react";
import { CronSchedule } from "../types";
import { MAX_DURATION_MINUTES, MIN_DURATION_MINUTES, parseCronExpression, releaseColor, TIME_UPDATE_FREQUENCY_MS } from "../utils";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { DateTime } from "luxon";

const DURATION_DEBOUNCE_MS = 500; // 500ms debounce for duration changes

interface CronScheduleListProps {
  schedules: CronSchedule[];
  timezone: string;
  projectionTimezone: string;
  onUpdateSchedule: (updatedSchedule: CronSchedule) => void;
  onDeleteSchedule: (scheduleId: string) => void;
  onError: (message: string, field: string) => void;
  clearError: () => void;
}

function CronScheduleListComponent({
  schedules,
  timezone,
  projectionTimezone,
  onUpdateSchedule,
  onDeleteSchedule,
  onError,
  clearError
}: CronScheduleListProps) {
  const [debouncedUpdates, setDebouncedUpdates] = useState<{
    [key: string]: NodeJS.Timeout;
  }>({});
  const [durationInputs, setDurationInputs] = useState<{
    [key: string]: string;
  }>({});
  const [currentTime, setCurrentTime] = useState<DateTime>(
    DateTime.now().setZone(projectionTimezone)
  );
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debouncedUpdates).forEach((timer) => clearTimeout(timer));
    };
  }, [debouncedUpdates]);

  // Update current time every minute
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentTime(DateTime.now().setZone(projectionTimezone));
    }, TIME_UPDATE_FREQUENCY_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [projectionTimezone]);

  // Initialize duration inputs
  useEffect(() => {
    const inputs: { [key: string]: string } = {};
    schedules.forEach((schedule) => {
      if (!durationInputs[schedule.id]) {
        inputs[schedule.id] = schedule.duration.toString();
      }
    });
    if (Object.keys(inputs).length > 0) {
      setDurationInputs((prev) => ({ ...prev, ...inputs }));
    }
  }, [schedules]);

  const validateDuration = (duration: number, field: string): boolean => {
    if (duration < MIN_DURATION_MINUTES) {
      onError(`Duration must be at least ${MIN_DURATION_MINUTES} minute`, field);
      return false;
    }
    if (duration > MAX_DURATION_MINUTES) {
      onError(`Duration cannot exceed ${MAX_DURATION_MINUTES} minutes (28 days)`, field);
      return false;
    }
    return true;
  };

  const handleDebouncedUpdate = useCallback(
    (schedule: CronSchedule, inputValue: string) => {
      // Clear any existing timer for this schedule
      if (debouncedUpdates[schedule.id]) {
        clearTimeout(debouncedUpdates[schedule.id]);
      }

      // Set new timer
      const timer = setTimeout(() => {
        const duration = parseInt(inputValue);
        if (!validateDuration(duration, schedule.id)) {
          // Revert to last valid value
          setDurationInputs((prev) => ({
            ...prev,
            [schedule.id]: schedule.duration.toString(),
          }));
          return;
        }

        onUpdateSchedule({ ...schedule, duration });
        clearError();

        // Clear the timer reference
        setDebouncedUpdates((prev) => {
          const newUpdates = { ...prev };
          delete newUpdates[schedule.id];
          return newUpdates;
        });
      }, DURATION_DEBOUNCE_MS);

      // Store the timer
      setDebouncedUpdates((prev) => ({
        ...prev,
        [schedule.id]: timer,
      }));
    },
    [debouncedUpdates, onUpdateSchedule, clearError]
  );

  const handleDeleteSchedule = (scheduleId: string) => {
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (schedule) {
      releaseColor(schedule.color);
    }
    onDeleteSchedule(scheduleId);
  };

  const isScheduleRunning = (schedule: CronSchedule): boolean => {
    try {
      const occurrences = parseCronExpression(
        schedule.expression,
        currentTime.toJSDate(),
        timezone,
      );

      return occurrences.some(startTime => {
        const endTime = startTime.plus({ minutes: schedule.duration });
        return currentTime >= startTime && currentTime < endTime;
      });
    } catch (err) {
      return false;
    }
  };

  return (
    <div className="space-y-2">
      {schedules.map((schedule) => (
        <div
          key={schedule.id}
          className={`flex items-center space-x-4 justify-between p-2 border rounded dark:border-gray-700 ${
            isScheduleRunning(schedule)
              ? 'ring-2 ring-blue-500 dark:ring-blue-400'
              : ''
          }`}
          style={{ backgroundColor: schedule.color + "20" }}
        >
          <input
            type="checkbox"
            checked={schedule.isActive}
            onChange={(e) =>
              onUpdateSchedule({
                ...schedule,
                isActive: e.target.checked,
              })
            }
            className="w-4 h-4 flex-none"
          />
          <input
            type="color"
            value={schedule.color || "#000000"}
            onChange={(e) => {
              const color = e.target.value;
              if (schedule) {
                releaseColor(schedule.color); // Release the old color
                onUpdateSchedule({
                  ...schedule,
                  color,
                });
              }
            }}
            className="w-4 h-4 cursor-pointer rounded-full flex-none"
            title="Choose any color"
          />
          <span className="font-medium text-gray-900 dark:text-white grow flex justify-start">
            {schedule.name}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-300 grow flex justify-end">
            {schedule.expression}
          </span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={durationInputs[schedule.id] || schedule.duration}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 5);
              setDurationInputs((prev) => ({
                ...prev,
                [schedule.id]: value,
              }));
              handleDebouncedUpdate(schedule, value);
            }}
            className="w-14 p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white text-center flex-none"
          />
          <span className="text-sm text-gray-600 dark:text-gray-300 flex-none">
            min
          </span>
          <button
            onClick={() => handleDeleteSchedule(schedule.id)}
            className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Delete schedule"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

export const CronScheduleList = memo(CronScheduleListComponent); 