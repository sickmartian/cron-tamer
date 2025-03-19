import { memo } from "react";

interface CronScheduleErrorProps {
  error: {
    message: string;
  } | null;
}

function CronScheduleErrorComponent({ error }: CronScheduleErrorProps) {
  if (!error) return null;
  
  return (
    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400">
      {error.message}
    </div>
  );
}

export const CronScheduleError = memo(CronScheduleErrorComponent); 