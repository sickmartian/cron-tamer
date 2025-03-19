import { useState, useEffect, useCallback } from "react";
import { CronSchedule, TimeSlot } from "./types";
import { CronScheduleTable } from "./components/CronScheduleTable";
import { CalendarManager } from "./components/CalendarManager";
import Select from 'react-select';
import { XMarkIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import { v4 as uuidv4 } from 'uuid';
import "./App.css";

interface TimezoneOption {
  value: string;
  label: string;
}

// Get all supported IANA timezones from the browser
const TIMEZONES: TimezoneOption[] = (Intl as any).supportedValuesOf?.('timeZone')?.map((tz: string) => ({ 
  value: tz, 
  label: tz 
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

// Custom styles for react-select to handle dark mode and alignment
const selectStyles = {
  control: (base: any) => ({
    ...base,
    backgroundColor: 'var(--select-bg)',
    borderColor: 'var(--select-border)',
    '&:hover': {
      borderColor: 'var(--select-border-hover)'
    }
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: 'var(--select-bg)',
    color: 'var(--select-text)'
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused 
      ? 'var(--select-option-hover-bg)' 
      : 'var(--select-bg)',
    color: 'var(--select-text)',
    textAlign: 'left',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'var(--select-option-hover-bg)'
    }
  }),
  singleValue: (base: any) => ({
    ...base,
    color: 'var(--select-text)',
    textAlign: 'left'
  }),
  input: (base: any) => ({
    ...base,
    color: 'var(--select-text)'
  })
};

const DEMO_SCHEDULES: CronSchedule[] = [
  {
    id: uuidv4(),
    name: "Daily Backup",
    expression: "0 1 * * *",
    duration: 60,
    isActive: true,
    color: "#4682B4" // Steel Blue
  },
  {
    id: uuidv4(),
    name: "Data Processing",
    expression: "30 1 * * *",
    duration: 45,
    isActive: true,
    color: "#98FB98" // Pale Green
  },
  {
    id: uuidv4(),
    name: "Long Running Task",
    expression: "0 2 * * *",
    duration: 180,
    isActive: true,
    color: "#FFD700" // Gold
  }
];

// Serialize state to base64 for URL hash
const serializeState = (state: {
  timezone: string;
  projectionTimezone: string;
  schedules: CronSchedule[];
  appTitle?: string;
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
      schedules: minimalSchedules,
      appTitle: state.appTitle
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
  const [showAbout, setShowAbout] = useState(false);
  const [appTitle, setAppTitle] = useState<string>("Cron Tamer");
  const [editingTitle, setEditingTitle] = useState(false);

  // Load state from URL hash or initialize with demo data
  useEffect(() => {
    try {
      const hash = window.location.hash;
      const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
      
      if (hash) {
        const state = deserializeState(hash);
        if (state) {
          if (state.timezone && TIMEZONES.some(tz => tz.value === state.timezone)) {
            setTimezone(state.timezone);
          }
          
          if (state.projectionTimezone && TIMEZONES.some(tz => tz.value === state.projectionTimezone)) {
            setProjectionTimezone(state.projectionTimezone);
          }
          
          if (Array.isArray(state.schedules)) {
            setSchedules(state.schedules);
          }

          if (state.appTitle) {
            setAppTitle(state.appTitle);
          }
        }
      } else if (!hasVisitedBefore) {
        // First time user, set demo schedules
        setSchedules(DEMO_SCHEDULES);
        localStorage.setItem('hasVisitedBefore', 'true');
      }
    } catch (e) {
      console.error("Error loading state from URL:", e);
    } finally {
      setHasLoadedFromURL(true);
    }
  }, []);

  // Update document title when appTitle changes
  useEffect(() => {
    document.title = appTitle || "Cron Tamer";
  }, [appTitle]);

  // Memoize the updateHash function to prevent unnecessary re-renders
  const updateHash = useCallback(() => {
    if (!hasLoadedFromURL) return; // Don't update URL until initial load is complete
    
    const state = {
      timezone,
      projectionTimezone,
      schedules,
      appTitle
    };
    
    const serialized = serializeState(state);
    if (!serialized) return;
    
    // Only update if hash is different
    if (window.location.hash.slice(1) !== serialized) {
      // Use history.replaceState to avoid adding browser history entries
      window.history.replaceState(null, '', `#${serialized}`);
    }
  }, [timezone, projectionTimezone, schedules, hasLoadedFromURL, appTitle]);

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

  const aboutContent = `
# Cron Tamer

A tool to visualize and compare cron schedules across different timezones.

## Features

- Visual representation of cron schedules
- Timezone comparison and projection
- Collision detection
- Shareable configurations
- Detailed day view
- Customizable application title so you can 'save' multiple environments

## How to Use

1. Add cron schedules using the table on the left
2. View the schedules in the calendar view
3. Click on any day for a detailed view
4. Change timezones to see how schedules align
5. Share your configuration using the Share button
6. Click the app's name to customize it

## About

This tool helps you understand how your cron schedules interact with each other and how they behave across different timezones.
It's particularly useful in case different jobs are sharing resources and need to be coordinated.
  `;

  // Add escape key handler
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showAbout) {
        setShowAbout(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showAbout]);

  return (
    <div className="container mx-auto p-4 min-h-screen bg-white dark:bg-gray-900">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          {editingTitle ? (
            <input
              type="text"
              value={appTitle}
              onChange={(e) => setAppTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setEditingTitle(false);
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
            onClick={() => setShowAbout(true)}
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

      {showAbout ? (
        <div className="fixed inset-0 bg-white dark:bg-gray-800 z-50 overflow-auto">
          <div className="max-w-3xl mx-auto py-8 px-4">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowAbout(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown>{aboutContent}</ReactMarkdown>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 flex gap-4 flex-wrap">
            <label className="flex items-center space-x-2 text-gray-900 dark:text-white min-w-[300px]">
              <span>Runner Timezone:</span>
              <Select
                options={TIMEZONES}
                value={TIMEZONES.find((tz: TimezoneOption) => tz.value === timezone)}
                onChange={(option) => option && setTimezone(option.value)}
                className="flex-1 min-w-[200px] z-50"
                styles={selectStyles}
                classNamePrefix="react-select"
              />
            </label>
            <label className="flex items-center space-x-2 text-gray-900 dark:text-white min-w-[300px]">
              <span>Project To Timezone:</span>
              <Select
                options={TIMEZONES}
                value={TIMEZONES.find((tz: TimezoneOption) => tz.value === projectionTimezone)}
                onChange={(option) => option && setProjectionTimezone(option.value)}
                className="flex-1 min-w-[200px] z-50"
                styles={selectStyles}
                classNamePrefix="react-select"
              />
            </label>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <CronScheduleTable
                schedules={schedules}
                onSchedulesChange={setSchedules}
                timezone={timezone}
                projectionTimezone={projectionTimezone}
              />
            </div>
            <div>
              <CalendarManager
                schedules={schedules}
                selectedSlot={selectedSlot}
                onSlotSelect={setSelectedSlot}
                timezone={timezone}
                projectionTimezone={projectionTimezone}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
