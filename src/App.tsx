import { useState, useEffect, useCallback } from "react";
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

// Serialize state to base64 for URL hash
const serializeState = (state: {
  timezone: string;
  projectionTimezone: string;
  schedules: CronSchedule[];
}) => {
  try {
    // Only include the necessary fields from schedules to keep the URL shorter
    const minimalSchedules = state.schedules.map(schedule => ({
      id: schedule.id,
      name: schedule.name,
      expression: schedule.expression,
      duration: schedule.duration,
      isActive: schedule.isActive,
      color: schedule.color
    }));

    const jsonString = JSON.stringify({
      timezone: state.timezone,
      projectionTimezone: state.projectionTimezone,
      schedules: minimalSchedules
    });
    
    // Use URL-safe base64 encoding (replace characters that need escaping in URLs)
    return btoa(jsonString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    console.error("Failed to serialize state:", e);
    return "";
  }
};

// Deserialize state from base64 URL hash
const deserializeState = (hash: string) => {
  try {
    // Remove # if present
    const base64 = hash.startsWith('#') ? hash.slice(1) : hash;
    
    // Restore URL-safe base64 to standard base64
    const standardBase64 = base64.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    const padding = standardBase64.length % 4;
    const paddedBase64 = padding ? 
      standardBase64 + '='.repeat(4 - padding) : 
      standardBase64;
    
    return JSON.parse(atob(paddedBase64));
  } catch (e) {
    console.error("Failed to parse state from URL:", e);
    return null;
  }
};

export default function App() {
  const [schedules, setSchedules] = useState<CronSchedule[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [timezone, setTimezone] = useState("UTC");
  const [projectionTimezone, setProjectionTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [hasLoadedFromURL, setHasLoadedFromURL] = useState(false);
  const [shareTooltip, setShareTooltip] = useState("");

  // Load state from URL hash on initial render
  useEffect(() => {
    try {
      const hash = window.location.hash;
      if (hash) {
        const state = deserializeState(hash);
        if (state) {
          if (state.timezone && TIMEZONES.includes(state.timezone)) {
            setTimezone(state.timezone);
          }
          
          if (state.projectionTimezone && TIMEZONES.includes(state.projectionTimezone)) {
            setProjectionTimezone(state.projectionTimezone);
          }
          
          if (Array.isArray(state.schedules)) {
            setSchedules(state.schedules);
          }
        }
      }
    } catch (e) {
      console.error("Error loading state from URL:", e);
    } finally {
      setHasLoadedFromURL(true);
    }
  }, []);

  // Memoize the updateHash function to prevent unnecessary re-renders
  const updateHash = useCallback(() => {
    if (!hasLoadedFromURL) return; // Don't update URL until initial load is complete
    
    const state = {
      timezone,
      projectionTimezone,
      schedules,
    };
    
    const serialized = serializeState(state);
    if (!serialized) return;
    
    // Only update if hash is different
    if (window.location.hash.slice(1) !== serialized) {
      // Use history.replaceState to avoid adding browser history entries
      window.history.replaceState(null, '', `#${serialized}`);
    }
  }, [timezone, projectionTimezone, schedules, hasLoadedFromURL]);

  // Update URL hash when state changes
  useEffect(() => {
    updateHash();
  }, [updateHash]);
  
  // Copy current URL to clipboard
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        setShareTooltip("URL copied to clipboard!");
        setTimeout(() => setShareTooltip(""), 2000);
      })
      .catch(err => {
        console.error("Failed to copy URL:", err);
        setShareTooltip("Failed to copy URL");
        setTimeout(() => setShareTooltip(""), 2000);
      });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Cron Schedule Comparison
        </h1>
        <div className="relative">
          <button 
            onClick={handleShare}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md"
          >
            Share
          </button>
          {shareTooltip && (
            <div className="absolute right-0 mt-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-md whitespace-nowrap">
              {shareTooltip}
            </div>
          )}
        </div>
      </div>
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
