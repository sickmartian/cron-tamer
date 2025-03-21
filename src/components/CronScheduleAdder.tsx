import { useState, memo } from "react";
import { CronSchedule } from "../types";
import {
  generateColor,
  MAX_DURATION_MINUTES,
  MIN_DURATION_MINUTES,
} from "../utils";

interface CronScheduleAdderProps {
  schedulesLength: number;
  onAddSchedule: (schedule: CronSchedule) => void;
  onError: (message: string, field: string) => void;
  clearError: () => void;
}

/**
 * CronScheduleAdder is a component that allows the user to add a new cron schedule
 */
function CronScheduleAdderComponent({
  schedulesLength,
  onAddSchedule,
  onError,
  clearError,
}: CronScheduleAdderProps) {
  const [newSchedule, setNewSchedule] = useState<Partial<CronSchedule>>({
    name: "",
    expression: "",
    duration: 30,
    isActive: true,
  });

  const validateCronExpression = (expression: string): boolean => {
    try {
      validateCronExpression(expression);
      return true;
    } catch (err) {
      onError("Invalid cron expression", "new-expression");
      return false;
    }
  };

  const validateDuration = (duration?: number): boolean => {
    if (duration === undefined || duration === null) {
      onError("Duration is required", "new-duration");
      return false;
    }
    if (duration < MIN_DURATION_MINUTES) {
      onError(
        `Duration must be at least ${MIN_DURATION_MINUTES} minute`,
        "new-duration"
      );
      return false;
    }
    if (duration > MAX_DURATION_MINUTES) {
      onError(
        `Duration cannot exceed ${MAX_DURATION_MINUTES} minutes (28 days)`,
        "new-duration"
      );
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

    if (!validateDuration(newSchedule.duration)) {
      return;
    }

    const name =
      newSchedule.name && newSchedule.name !== ""
        ? newSchedule.name
        : newSchedule.expression;

    const schedule: CronSchedule = {
      id: crypto.randomUUID(),
      name,
      expression: newSchedule.expression,
      duration: newSchedule.duration!,
      isActive: newSchedule.isActive ?? true,
      color: generateColor(schedulesLength),
    };

    onAddSchedule(schedule);
    setNewSchedule({
      name: "",
      expression: "",
      duration: 30,
      isActive: true,
    });
    clearError();
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <input
            type="text"
            placeholder="Cron Expression"
            value={newSchedule.expression}
            onChange={(e) => {
              setNewSchedule({ ...newSchedule, expression: e.target.value });
              clearError();
            }}
            className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Duration (minutes)"
            value={newSchedule.duration}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              setNewSchedule({
                ...newSchedule,
                duration: parseInt(value),
              });
              clearError();
            }}
            className="p-2 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
        >
          Add Schedule
        </button>
      </div>
    </form>
  );
}

export const CronScheduleAdder = memo(CronScheduleAdderComponent);
