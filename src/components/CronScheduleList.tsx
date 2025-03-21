import { useState, useEffect, useCallback, useRef, memo } from "react";
import { CronSchedule, TimeSlot } from "../types";
import {
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
  releaseColor,
  TIME_UPDATE_FREQUENCY_MS,
  validateCronExpression,
} from "../utils";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { DateTime } from "luxon";

const DURATION_DEBOUNCE_MS = 500; // 500ms debounce for duration changes

interface CronScheduleListProps {
  schedules: CronSchedule[];
  timeSlots: TimeSlot[];
  onUpdateSchedule: (updatedSchedule: CronSchedule) => void;
  onDeleteSchedule: (scheduleId: string) => void;
  onError: (message: string) => void;
  clearError: () => void;
}

interface InputState {
  duration: { [key: string]: string };
  name: { [key: string]: string };
  expression: { [key: string]: string };
}

/**
 * CronScheduleList is a component that renders a list of cron schedules
 * It allows the user to edit and delete schedules
 */
function CronScheduleListComponent({
  schedules,
  timeSlots,
  onUpdateSchedule,
  onDeleteSchedule,
  onError,
  clearError,
}: CronScheduleListProps) {
  const [debouncedUpdates, setDebouncedUpdates] = useState<{
    [key: string]: NodeJS.Timeout;
  }>({});
  const [inputState, setInputState] = useState<InputState>({
    duration: {},
    name: {},
    expression: {},
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<{
    [key: string]: { name: boolean; expression: boolean };
  }>({});
  const [currentlyRunningScheduleIds, setCurrentlyRunningScheduleIds] = useState<string[]>([]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debouncedUpdates).forEach((timer) => clearTimeout(timer));
    };
  }, [debouncedUpdates]);

  // Update current time every minute
  useEffect(() => {
    calculateCurrentlyRunningSchedules(timeSlots);
    intervalRef.current = setInterval(() => {
      calculateCurrentlyRunningSchedules(timeSlots);
    }, TIME_UPDATE_FREQUENCY_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timeSlots]);

  // Initialize input states
  useEffect(() => {
    const newInputs: InputState = {
      duration: { ...inputState.duration },
      name: { ...inputState.name },
      expression: { ...inputState.expression },
    };

    let hasNewInputs = false;

    schedules.forEach((schedule) => {
      if (!newInputs.duration[schedule.id]) {
        newInputs.duration[schedule.id] = schedule.duration.toString();
        hasNewInputs = true;
      }
      if (!newInputs.name[schedule.id]) {
        newInputs.name[schedule.id] = schedule.name;
        hasNewInputs = true;
      }
      if (!newInputs.expression[schedule.id]) {
        newInputs.expression[schedule.id] = schedule.expression;
        hasNewInputs = true;
      }
    });

    if (hasNewInputs) {
      setInputState(newInputs);
    }
  }, [schedules]);

  const validateDuration = (duration: number): boolean => {
    if (duration < MIN_DURATION_MINUTES) {
      onError(`Duration must be at least ${MIN_DURATION_MINUTES} minute`);
      return false;
    }
    if (duration > MAX_DURATION_MINUTES) {
      onError(
        `Duration cannot exceed ${MAX_DURATION_MINUTES} minutes (28 days)`
      );
      return false;
    }
    return true;
  };

  const validateExpression = (expression: string): boolean => {
    try {
      validateCronExpression(expression);
      return true;
    } catch (err) {
      onError("Invalid cron expression");
      return false;
    }
  };

  // Generic debounced update function for any field
  const handleDebouncedUpdate = useCallback(
    (schedule: CronSchedule, field: keyof CronSchedule, value: any) => {
      // Create a unique key for this field and schedule
      const debounceKey = `${schedule.id}_${field}`;

      // Clear any existing timer for this field and schedule
      if (debouncedUpdates[debounceKey]) {
        clearTimeout(debouncedUpdates[debounceKey]);
      }

      // Set new timer
      const timer = setTimeout(() => {
        let isValid = true;
        let updatedValue = value;

        // Validate based on field type
        if (field === "duration") {
          const duration = parseInt(value);
          isValid = validateDuration(duration);
          updatedValue = duration;
        } else if (field === "expression") {
          isValid = validateExpression(value);
        } else if (field === "name" && (!value || value.trim() === "")) {
          // If name is empty, use expression
          updatedValue = schedule.expression;
        }

        if (!isValid) {
          // Revert to last valid value
          setInputState((prev) => {
            const newState = { ...prev };
            newState[field as keyof InputState][schedule.id] = schedule[
              field
            ] as string;
            return newState;
          });
          return;
        }

        // Update the schedule
        const updatedSchedule = { ...schedule, [field]: updatedValue };
        onUpdateSchedule(updatedSchedule);
        clearError();

        // Clear the timer reference
        setDebouncedUpdates((prev) => {
          const newUpdates = { ...prev };
          delete newUpdates[debounceKey];
          return newUpdates;
        });

        // If we're done editing, clear the editing state
        if (field === "name" || field === "expression") {
          setEditingSchedule((prev) => {
            const newState = { ...prev };
            if (newState[schedule.id]) {
              newState[schedule.id][field as "name" | "expression"] = false;
            }
            return newState;
          });
        }
      }, DURATION_DEBOUNCE_MS);

      // Store the timer
      setDebouncedUpdates((prev) => ({
        ...prev,
        [debounceKey]: timer,
      }));
    },
    [debouncedUpdates, onUpdateSchedule, clearError]
  );

  const handleInputChange = useCallback(
    (schedule: CronSchedule, field: keyof InputState, value: string) => {
      setInputState((prev) => {
        const newState = { ...prev };
        newState[field][schedule.id] = value;
        return newState;
      });

      // For duration, start debounce immediately
      // For name/expression, wait until user is done editing
      if (
        field === "duration" ||
        !editingSchedule[schedule.id]?.[field as "name" | "expression"]
      ) {
        handleDebouncedUpdate(schedule, field as keyof CronSchedule, value);
      }
    },
    [handleDebouncedUpdate, editingSchedule]
  );

  const handleStartEditing = (
    scheduleId: string,
    field: "name" | "expression"
  ) => {
    setEditingSchedule((prev) => {
      const newState = { ...prev };
      if (!newState[scheduleId]) {
        newState[scheduleId] = { name: false, expression: false };
      }
      newState[scheduleId][field] = true;
      return newState;
    });
  };

  const handleFinishEditing = (
    schedule: CronSchedule,
    field: "name" | "expression"
  ) => {
    setEditingSchedule((prev) => {
      const newState = { ...prev };
      if (newState[schedule.id]) {
        newState[schedule.id][field] = false;
      }
      return newState;
    });

    // Apply the debounced update
    const value = inputState[field][schedule.id];
    handleDebouncedUpdate(schedule, field, value);
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (schedule) {
      releaseColor(schedule.color);
    }
    onDeleteSchedule(scheduleId);
  };

  const calculateCurrentlyRunningSchedules = (timeSlots: TimeSlot[]) => {
    const currentTime = DateTime.now();
    const currentlyRunningScheduleIds = timeSlots.filter((slot) => {
      const endTime = slot.start.plus({minutes: slot.duration});
      return currentTime >= slot.start && currentTime < endTime;
    }).map((slot) => slot.scheduleId);
    setCurrentlyRunningScheduleIds(currentlyRunningScheduleIds);
  };

  return (
    <div className="space-y-2">
      {schedules.map((schedule) => (
        <div
          key={schedule.id}
          className={`flex items-center space-x-4 justify-between p-2 border rounded dark:border-gray-700 ${
            currentlyRunningScheduleIds.includes(schedule.id)
              ? "ring-2 ring-blue-500 dark:ring-blue-400"
              : ""
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

          {/* Editable name */}
          {editingSchedule[schedule.id]?.name ? (
            <input
              type="text"
              value={inputState.name[schedule.id] || schedule.name}
              onChange={(e) =>
                handleInputChange(schedule, "name", e.target.value)
              }
              onBlur={() => handleFinishEditing(schedule, "name")}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleFinishEditing(schedule, "name");
                if (e.key === "Escape") {
                  setInputState((prev) => ({
                    ...prev,
                    name: {
                      ...prev.name,
                      [schedule.id]: schedule.name,
                    },
                  }));
                  handleFinishEditing(schedule, "name");
                }
              }}
              autoFocus
              className="font-medium text-gray-900 dark:text-white grow p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          ) : (
            <span
              className="font-medium text-gray-900 dark:text-white grow flex justify-start cursor-pointer hover:text-blue-500 dark:hover:text-blue-400"
              onClick={() => handleStartEditing(schedule.id, "name")}
              title="Click to edit name"
            >
              {schedule.name}
            </span>
          )}

          {/* Editable expression */}
          {editingSchedule[schedule.id]?.expression ? (
            <input
              type="text"
              value={inputState.expression[schedule.id] || schedule.expression}
              onChange={(e) =>
                handleInputChange(schedule, "expression", e.target.value)
              }
              onBlur={() => handleFinishEditing(schedule, "expression")}
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  handleFinishEditing(schedule, "expression");
                if (e.key === "Escape") {
                  setInputState((prev) => ({
                    ...prev,
                    expression: {
                      ...prev.expression,
                      [schedule.id]: schedule.expression,
                    },
                  }));
                  handleFinishEditing(schedule, "expression");
                }
              }}
              autoFocus
              className="text-sm text-gray-600 dark:text-gray-300 grow p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          ) : (
            <span
              className="text-sm text-gray-600 dark:text-gray-300 grow flex justify-end cursor-pointer hover:text-blue-500 dark:hover:text-blue-400"
              onClick={() => handleStartEditing(schedule.id, "expression")}
              title="Click to edit expression"
            >
              {schedule.expression}
            </span>
          )}

          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={inputState.duration[schedule.id] || schedule.duration}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 5);
              handleInputChange(schedule, "duration", value);
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
