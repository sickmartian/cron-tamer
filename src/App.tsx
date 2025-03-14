import { useState } from "react";
import { CronSchedule, TimeSlot } from "./types";
import { CronScheduleTable } from "./components/CronScheduleTable";
import { Calendar } from "./components/Calendar";
import "./App.css";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Madrid",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
];

export default function App() {
  const [schedules, setSchedules] = useState<CronSchedule[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [timezone, setTimezone] = useState("UTC");
  const [projectionTimezone, setProjectionTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        Cron Schedule Comparison
      </h1>
      <div className="mb-4 flex gap-4">
        <label className="flex items-center space-x-2 text-gray-900 dark:text-white">
          <span>Runner Timezone:</span>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center space-x-2 text-gray-900 dark:text-white">
          <span>Project To Timezone:</span>
          <select
            value={projectionTimezone}
            onChange={(e) => setProjectionTimezone(e.target.value)}
            className="border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <CronScheduleTable
            schedules={schedules}
            onSchedulesChange={setSchedules}
          />
        </div>
        <div>
          <Calendar
            schedules={schedules}
            selectedSlot={selectedSlot}
            onSlotSelect={setSelectedSlot}
            timezone={timezone}
            projectionTimezone={projectionTimezone}
          />
        </div>
      </div>
    </div>
  );
}
