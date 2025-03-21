import { useState, useCallback, memo } from "react";
import { CronSchedule, TimeSlot } from "../types";
import { validateCronExpression } from "../utils";
import { CronScheduleAdder } from "./CronScheduleAdder";
import { CronScheduleError } from "./CronScheduleError";
import { CronScheduleList } from "./CronScheduleList";

interface CronScheduleTableProps {
  schedules: CronSchedule[];
  timeSlots: TimeSlot[];
  onSchedulesChange: (schedules: CronSchedule[]) => void;
}

type ErrorState = {
  message: string;
};

/**
 * CronSchedulePanel is a component that allows the user to add, edit and delete cron schedules
 */
function CronSchedulePanelComponent({
  schedules,
  timeSlots,
  onSchedulesChange,
}: CronScheduleTableProps) {
  const [error, setError] = useState<ErrorState | null>(null);

  // Auto-clear error after 3 seconds
  const handleError = useCallback((message: string) => {
    setError({ message });

    // Auto-clear after 3 seconds
    const timer = setTimeout(() => {
      setError(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleAddSchedule = useCallback(
    (schedule: CronSchedule) => {
      onSchedulesChange([...schedules, schedule]);
    },
    [schedules, onSchedulesChange]
  );

  const handleUpdateSchedule = useCallback(
    (updatedSchedule: CronSchedule) => {
      // Validate cron expression
      try {
        validateCronExpression(updatedSchedule.expression);
      } catch (err) {
        handleError("Invalid cron expression");
        return;
      }

      onSchedulesChange(
        schedules.map((schedule) =>
          schedule.id === updatedSchedule.id ? updatedSchedule : schedule
        )
      );
    },
    [schedules, onSchedulesChange, handleError]
  );

  const handleDeleteSchedule = useCallback(
    (scheduleId: string) => {
      onSchedulesChange(
        schedules.filter((schedule) => schedule.id !== scheduleId)
      );
    },
    [schedules, onSchedulesChange]
  );

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
        Cron Schedules
      </h2>

      <CronScheduleAdder
        onAddSchedule={handleAddSchedule}
        onError={handleError}
        clearError={clearError}
        schedulesLength={schedules.length}
      />

      <CronScheduleError error={error} />

      <CronScheduleList
        schedules={schedules}
        timeSlots={timeSlots}
        onUpdateSchedule={handleUpdateSchedule}
        onDeleteSchedule={handleDeleteSchedule}
        onError={handleError}
        clearError={clearError}
      />
    </div>
  );
}

export const CronSchedulePanel = memo(CronSchedulePanelComponent);
