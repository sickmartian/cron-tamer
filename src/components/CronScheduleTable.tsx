import React, { useState, useEffect, useCallback } from "react";
import { CronSchedule } from "../types";
import { generateColor, parseCronExpression } from "../utils";

const MAX_DURATION_MINUTES = 28 * 24 * 60; // 28 days in minutes
const MIN_DURATION_MINUTES = 1;
const DURATION_DEBOUNCE_MS = 500; // 500ms debounce for duration changes

interface CronScheduleTableProps {
  schedules: CronSchedule[];
  onSchedulesChange: (schedules: CronSchedule[]) => void;
}

type ErrorState = {
  message: string;
  field: 'new-expression' | 'new-duration' | string; // string for schedule IDs
}

export function CronScheduleTable({
  schedules,
  onSchedulesChange,
}: CronScheduleTableProps) {
  const [newSchedule, setNewSchedule] = useState<Partial<CronSchedule> & { durationInput?: string }>({
    name: "",
    expression: "",
    durationInput: "30",
    isActive: true,
  });
  const [error, setError] = useState<ErrorState | null>(null);
  const [debouncedUpdates, setDebouncedUpdates] = useState<{[key: string]: NodeJS.Timeout}>({});
  const [durationInputs, setDurationInputs] = useState<{[key: string]: string}>({});

  // Auto-clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debouncedUpdates).forEach(timer => clearTimeout(timer));
    };
  }, [debouncedUpdates]);

  const validateCronExpression = (expression: string): boolean => {
    try {
      parseCronExpression(expression);
      return true;
    } catch (err) {
      setError({ message: "Invalid cron expression", field: 'new-expression' });
      return false;
    }
  };

  const validateDuration = (duration: number, field: ErrorState['field']): boolean => {
    if (duration < MIN_DURATION_MINUTES) {
      setError({ 
        message: `Duration must be at least ${MIN_DURATION_MINUTES} minute`,
        field
      });
      return false;
    }
    if (duration > MAX_DURATION_MINUTES) {
      setError({
        message: `Duration cannot exceed ${MAX_DURATION_MINUTES} minutes (28 days)`,
        field
      });
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedule.expression) return;

    if (!validateCronExpression(newSchedule.expression)) {
      return;
    }

    const duration = parseInt(newSchedule.durationInput || "30");
    if (!validateDuration(duration, 'new-duration')) {
      return;
    }

    if (!newSchedule.name || newSchedule.name === "") {
      newSchedule.name = newSchedule.expression;
    }

    const schedule: CronSchedule = {
      id: crypto.randomUUID(),
      name: newSchedule.name ?? newSchedule.expression,
      expression: newSchedule.expression,
      duration: duration,
      isActive: newSchedule.isActive ?? true,
      color: generateColor(schedules.length),
    };

    onSchedulesChange([...schedules, schedule]);
    setNewSchedule({
      name: "",
      expression: "",
      durationInput: "30",
      isActive: true,
    });
    setError(null);
  };

  const handleUpdateSchedule = (updatedSchedule: CronSchedule) => {
    if (
      updatedSchedule.expression &&
      !validateCronExpression(updatedSchedule.expression)
    ) {
      return;
    }

    if (!validateDuration(updatedSchedule.duration, updatedSchedule.id)) {
      return;
    }

    onSchedulesChange(
      schedules.map((schedule) =>
        schedule.id === updatedSchedule.id ? updatedSchedule : schedule
      )
    );
    setError(null);
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    onSchedulesChange(
      schedules.filter((schedule) => schedule.id !== scheduleId)
    );
  };

  const handleDebouncedUpdate = useCallback((schedule: CronSchedule, inputValue: string) => {
    // Clear any existing timer for this schedule
    if (debouncedUpdates[schedule.id]) {
      clearTimeout(debouncedUpdates[schedule.id]);
    }

    // Set new timer
    const timer = setTimeout(() => {
      const duration = parseInt(inputValue);
      if (!validateDuration(duration, schedule.id)) {
        // Revert to last valid value
        setDurationInputs(prev => ({
          ...prev,
          [schedule.id]: schedule.duration.toString()
        }));
        return;
      }

      onSchedulesChange(
        schedules.map((s) =>
          s.id === schedule.id ? { ...schedule, duration } : s
        )
      );
      setError(null);
      
      // Clear the timer reference
      setDebouncedUpdates(prev => {
        const newUpdates = { ...prev };
        delete newUpdates[schedule.id];
        return newUpdates;
      });
    }, DURATION_DEBOUNCE_MS);

    // Store the timer
    setDebouncedUpdates(prev => ({
      ...prev,
      [schedule.id]: timer
    }));
  }, [schedules, onSchedulesChange, debouncedUpdates]);

  // Initialize duration inputs
  useEffect(() => {
    const inputs: {[key: string]: string} = {};
    schedules.forEach(schedule => {
      if (!durationInputs[schedule.id]) {
        inputs[schedule.id] = schedule.duration.toString();
      }
    });
    if (Object.keys(inputs).length > 0) {
      setDurationInputs(prev => ({ ...prev, ...inputs }));
    }
  }, [schedules]);

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        Cron Schedules
      </h2>

      <form onSubmit={handleSubmit} className="mb-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Cron Expression"
              value={newSchedule.expression}
              onChange={(e) => {
                setNewSchedule({ ...newSchedule, expression: e.target.value });
                setError(null);
              }}
              className={`p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                error?.field === 'new-expression' ? "border-red-500" : ""
              }`}
            />
          </div>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Duration (minutes)"
              value={newSchedule.durationInput}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setNewSchedule({
                  ...newSchedule,
                  durationInput: value,
                });
                setError(null);
              }}
              className={`p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                error?.field === 'new-duration' ? "border-red-500" : ""
              }`}
            />
          </div>
          <input
            type="text"
            placeholder="Schedule Name"
            value={newSchedule.name}
            onChange={(e) =>
              setNewSchedule({ ...newSchedule, name: e.target.value })
            }
            className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            type="submit"
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={!!error}
          >
            Add Schedule
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400">
          {error.message}
        </div>
      )}

      <div className="space-y-2">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="flex items-center justify-between p-2 border rounded dark:border-gray-700"
            style={{ backgroundColor: schedule.color + "20" }}
          >
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={schedule.isActive}
                onChange={(e) =>
                  handleUpdateSchedule({
                    ...schedule,
                    isActive: e.target.checked,
                  })
                }
                className="w-4 h-4"
              />
              <span className="font-medium text-gray-900 dark:text-white">
                {schedule.name}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {schedule.expression}
              </span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={durationInputs[schedule.id] || schedule.duration}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setDurationInputs(prev => ({
                    ...prev,
                    [schedule.id]: value
                  }));
                  handleDebouncedUpdate(schedule, value);
                }}
                className={`w-20 p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  error?.field === schedule.id ? "border-red-500" : ""
                }`}
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                min
              </span>
            </div>
            <button
              onClick={() => handleDeleteSchedule(schedule.id)}
              className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
