import { memo } from "react";

interface CronScheduleErrorProps {
  error: {
    message: string;
  } | null;
}

/**
 * CronScheduleError is a component that renders an error message
 * It is used to display errors that occur when adding, editing or deleting cron schedules
 */
function CronScheduleErrorComponent({ error }: CronScheduleErrorProps) {
  if (!error) return null;
  
  return (
    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400">
      {error.message}
    </div>
  );
}

export const CronScheduleError = memo(CronScheduleErrorComponent); 