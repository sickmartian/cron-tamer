import React, { useState, useEffect } from "react";
import { CronSchedule } from "../types";
import { generateColor, parseCronExpression } from "../utils";

interface CronScheduleTableProps {
  schedules: CronSchedule[];
  onSchedulesChange: (schedules: CronSchedule[]) => void;
}

export function CronScheduleTable({
  schedules,
  onSchedulesChange,
}: CronScheduleTableProps) {
  const [newSchedule, setNewSchedule] = useState<Partial<CronSchedule>>({
    name: "",
    expression: "",
    duration: 30,
    isActive: true,
  });
  const [error, setError] = useState<string | null>(null);

  // Auto-clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const validateCronExpression = (expression: string): boolean => {
    try {
      parseCronExpression(expression);
      return true;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError("Invalid cron expression");
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedule.expression) return;

    if (!validateCronExpression(newSchedule.expression)) {
      return;
    }

    const schedule: CronSchedule = {
      id: crypto.randomUUID(),
      name: newSchedule.name ?? newSchedule.expression,
      expression: newSchedule.expression,
      duration: newSchedule.duration || 30,
      isActive: newSchedule.isActive ?? true,
      color: generateColor(schedules.length),
    };

    onSchedulesChange([...schedules, schedule]);
    setNewSchedule({
      name: "",
      expression: "",
      duration: 30,
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

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Cron Schedules</h2>

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
              className={`p-2 border rounded w-full ${
                error ? "border-red-500" : ""
              }`}
            />
            {error && (
              <div className="absolute top-full left-0 mt-1 text-sm text-red-500 bg-red-50 p-1 rounded">
                {error}
              </div>
            )}
          </div>
          <input
            type="number"
            placeholder="Duration (minutes)"
            value={newSchedule.duration}
            onChange={(e) =>
              setNewSchedule({
                ...newSchedule,
                duration: parseInt(e.target.value),
              })
            }
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Schedule Name"
            value={newSchedule.name}
            onChange={(e) =>
              setNewSchedule({ ...newSchedule, name: e.target.value })
            }
            className="p-2 border rounded"
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

      <div className="space-y-2">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="flex items-center justify-between p-2 border rounded"
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
              <span className="font-medium">{schedule.name}</span>
              <span className="text-sm text-gray-600">
                {schedule.expression}
              </span>
              <span className="text-sm text-gray-600">
                {schedule.duration}min
              </span>
            </div>
            <button
              onClick={() => handleDeleteSchedule(schedule.id)}
              className="p-1 text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
