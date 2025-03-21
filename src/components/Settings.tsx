import { v4 as uuidv4 } from "uuid";
import { useState, useEffect, useCallback, memo } from "react";
import { CronSchedule } from "../types";
import Select from "react-select";

const DEMO_SCHEDULES: CronSchedule[] = [
  {
    id: uuidv4(),
    name: "Daily Backup",
    expression: "0 1 * * *",
    duration: 60,
    isActive: true,
    color: "#4682B4", // Steel Blue
  },
  {
    id: uuidv4(),
    name: "Data Processing",
    expression: "30 1 * * *",
    duration: 45,
    isActive: true,
    color: "#98FB98", // Pale Green
  },
  {
    id: uuidv4(),
    name: "Long Running Task",
    expression: "0 2 * * *",
    duration: 180,
    isActive: true,
    color: "#FFD700", // Gold
  },
];

// Custom styles for react-select to handle dark mode and alignment
const selectStyles = {
  control: (base: any) => ({
    ...base,
    backgroundColor: "var(--select-bg)",
    borderColor: "var(--select-border)",
    "&:hover": {
      borderColor: "var(--select-border-hover)",
    },
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: "var(--select-bg)",
    color: "var(--select-text)",
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused
      ? "var(--select-option-hover-bg)"
      : "var(--select-bg)",
    color: "var(--select-text)",
    textAlign: "left",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "var(--select-option-hover-bg)",
    },
  }),
  singleValue: (base: any) => ({
    ...base,
    color: "var(--select-text)",
    textAlign: "left",
  }),
  input: (base: any) => ({
    ...base,
    color: "var(--select-text)",
  }),
};

interface TimezoneOption {
  value: string;
  label: string;
}

// Get all supported IANA timezones from the browser
const TIMEZONES: TimezoneOption[] = (Intl as any)
  .supportedValuesOf?.("timeZone")
  ?.map((tz: string) => ({
    value: tz,
    label: tz,
  })) ?? [
  // Fallback list for browsers that don't support Intl.supportedValuesOf
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "America/New_York" },
  { value: "America/Chicago", label: "America/Chicago" },
  { value: "America/Denver", label: "America/Denver" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "Europe/Paris", label: "Europe/Paris" },
  { value: "Europe/Madrid", label: "Europe/Madrid" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai" },
  { value: "Australia/Sydney", label: "Australia/Sydney" },
];

interface SettingsProps {
  onTimezoneChange: (timezone: string) => void;
  onProjectionTimezoneChange: (timezone: string) => void;
  onSchedulesChange: (schedules: CronSchedule[]) => void;
  onShowAboutChange: (show: boolean) => void;
  initialTimezone: string;
  initialProjectionTimezone: string;
  initialSchedules: CronSchedule[];
}

// Serialize state to base64 for URL hash
const serializeState = (state: {
  timezone: string;
  projectionTimezone: string;
  schedules: CronSchedule[];
  appTitle?: string;
}) => {
  try {
    // Only include the necessary fields from schedules to keep the URL shorter
    const minimalSchedules = state.schedules.map((schedule) => ({
      id: schedule.id,
      name: schedule.name,
      expression: schedule.expression,
      duration: schedule.duration,
      isActive: schedule.isActive,
      color: schedule.color,
    }));

    const jsonString = JSON.stringify({
      timezone: state.timezone,
      projectionTimezone: state.projectionTimezone,
      schedules: minimalSchedules,
      appTitle: state.appTitle,
    });

    // Use URL-safe base64 encoding (replace characters that need escaping in URLs)
    return btoa(jsonString)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  } catch (e) {
    console.error("Failed to serialize state:", e);
    return "";
  }
};

// Deserialize state from base64 URL hash
const deserializeState = (hash: string) => {
  try {
    // Remove # if present
    const base64 = hash.startsWith("#") ? hash.slice(1) : hash;

    // Restore URL-safe base64 to standard base64
    const standardBase64 = base64.replace(/-/g, "+").replace(/_/g, "/");

    // Add padding if needed
    const padding = standardBase64.length % 4;
    const paddedBase64 = padding
      ? standardBase64 + "=".repeat(4 - padding)
      : standardBase64;

    return JSON.parse(atob(paddedBase64));
  } catch (e) {
    console.error("Failed to parse state from URL:", e);
    return null;
  }
};

/**
 * Settings is a component that allows the user to configure the timezone and projection timezone
 * It also allows the user to edit the app title.
 * It centralizes a ton of state in the app so App doesn't have to manage it and re-render all children components.
 */
function SettingsComponent({
  onTimezoneChange,
  onProjectionTimezoneChange,
  onSchedulesChange,
  onShowAboutChange,
  initialTimezone,
  initialProjectionTimezone,
  initialSchedules,
}: SettingsProps) {
  const [timezone, setTimezone] = useState(initialTimezone);
  const [projectionTimezone, setProjectionTimezone] = useState(
    initialProjectionTimezone
  );
  const [hasLoadedFromURL, setHasLoadedFromURL] = useState(false);
  const [shareTooltip, setShareTooltip] = useState("");
  const [appTitle, setAppTitle] = useState<string>("Cron Tamer");
  const [editingTitle, setEditingTitle] = useState(false);

  // Keep track of schedules without causing re-renders
  const schedulesRef = useCallback(() => initialSchedules, [initialSchedules]);

  // Load state from URL hash or initialize with demo data
  useEffect(() => {
    try {
      const hash = window.location.hash;

      const hasVisitedBefore = localStorage.getItem("hasVisitedBefore");
      if (!hasVisitedBefore && !hash) {
        onSchedulesChange(DEMO_SCHEDULES);
        localStorage.setItem("hasVisitedBefore", "true");
      } else if (hash) {
        const state = deserializeState(hash);
        if (state) {
          if (
            state.timezone &&
            TIMEZONES.some((tz) => tz.value === state.timezone)
          ) {
            setTimezone(state.timezone);
            onTimezoneChange(state.timezone);
          }

          if (
            state.projectionTimezone &&
            TIMEZONES.some((tz) => tz.value === state.projectionTimezone)
          ) {
            setProjectionTimezone(state.projectionTimezone);
            onProjectionTimezoneChange(state.projectionTimezone);
          }

          if (Array.isArray(state.schedules)) {
            onSchedulesChange(state.schedules);
          }

          if (state.appTitle) {
            changeTitle(state.appTitle);
          }
        }
      }
    } catch (e) {
      console.error("Error loading state from URL:", e);
    } finally {
      setHasLoadedFromURL(true);
    }
  }, []);

  const changeTitle = (newTitle: string) => {
    setAppTitle(newTitle);
    document.title = newTitle;
  };

  // Handle timezone change
  const handleTimezoneChange = (newTimezone: string) => {
    setTimezone(newTimezone);
    onTimezoneChange(newTimezone);
  };

  // Handle projection timezone change
  const handleProjectionTimezoneChange = (newTimezone: string) => {
    setProjectionTimezone(newTimezone);
    onProjectionTimezoneChange(newTimezone);
  };

  // Memoize the updateHash function to prevent unnecessary re-renders
  const updateHash = useCallback(() => {
    if (!hasLoadedFromURL) return; // Don't update URL until initial load is complete

    const state = {
      timezone,
      projectionTimezone,
      schedules: schedulesRef(),
      appTitle,
    };

    const serialized = serializeState(state);
    if (!serialized) return;

    // Only update if hash is different
    if (window.location.hash.slice(1) !== serialized) {
      // Use history.replaceState to avoid adding browser history entries
      window.history.replaceState(null, "", `#${serialized}`);
    }
  }, [timezone, projectionTimezone, schedulesRef, hasLoadedFromURL, appTitle]);

  // Update URL hash when state changes
  useEffect(() => {
    updateHash();
  }, [updateHash]);

  // Copy current URL to clipboard
  const handleShare = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setShareTooltip("URL copied to clipboard!");
        setTimeout(() => setShareTooltip(""), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy URL:", err);
        setShareTooltip("Failed to copy URL");
        setTimeout(() => setShareTooltip(""), 2000);
      });
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          {editingTitle ? (
            <input
              type="text"
              value={appTitle}
              onChange={(e) => changeTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape")
                  setEditingTitle(false);
              }}
              autoFocus
              className="text-2xl font-bold py-1 px-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white"
            />
          ) : (
            <h1
              className="text-2xl font-bold text-gray-900 dark:text-white cursor-pointer hover:text-blue-500 dark:hover:text-blue-400"
              onClick={() => setEditingTitle(true)}
              title="Click to edit title"
            >
              {appTitle}
            </h1>
          )}
          <button
            onClick={() => onShowAboutChange(true)}
            className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            About
          </button>
        </div>
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

      <div className="mb-4 flex gap-4 flex-wrap">
        <label className="flex items-center space-x-2 text-gray-900 dark:text-white min-w-[300px]">
          <span>Runner Timezone:</span>
          <Select
            options={TIMEZONES}
            value={TIMEZONES.find(
              (tz: TimezoneOption) => tz.value === timezone
            )}
            onChange={(option) => option && handleTimezoneChange(option.value)}
            className="flex-1 min-w-[200px] z-50"
            styles={selectStyles}
            classNamePrefix="react-select"
          />
        </label>
        <label className="flex items-center space-x-2 text-gray-900 dark:text-white min-w-[300px]">
          <span>Project To Timezone:</span>
          <Select
            options={TIMEZONES}
            value={TIMEZONES.find(
              (tz: TimezoneOption) => tz.value === projectionTimezone
            )}
            onChange={(option) =>
              option && handleProjectionTimezoneChange(option.value)
            }
            className="flex-1 min-w-[200px] z-50"
            styles={selectStyles}
            classNamePrefix="react-select"
          />
        </label>
      </div>
    </div>
  );
}

// Use React.memo to prevent unnecessary re-renders
export const Settings = memo(SettingsComponent);
