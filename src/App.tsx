import { useState, useEffect, useCallback } from "react";
import { CronSchedule } from "./types";
import { CronSchedulePanel } from "./components/CronSchedulePanel";
import { ViewManager } from "./components/ViewManager";
import { Settings } from "./components/Settings";
import About from "./components/About";
import "./App.css";

export default function App() {
  const [schedules, setSchedules] = useState<CronSchedule[]>([]);
  const [timezone, setTimezone] = useState("UTC");
  const [projectionTimezone, setProjectionTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [showAbout, setShowAbout] = useState(false);

  // Memoize handlers to prevent unnecessary re-renders
  const handleTimezoneChange = useCallback((newTimezone: string) => {
    setTimezone(newTimezone);
  }, []);

  const handleProjectionTimezoneChange = useCallback((newTimezone: string) => {
    setProjectionTimezone(newTimezone);
  }, []);

  const handleSchedulesChange = useCallback((newSchedules: CronSchedule[]) => {
    setSchedules(newSchedules);
  }, []);

  const handleShowAboutChange = useCallback((show: boolean) => {
    setShowAbout(show);
  }, []);

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
      <Settings 
        initialTimezone={timezone}
        initialProjectionTimezone={projectionTimezone}
        initialSchedules={schedules}
        onTimezoneChange={handleTimezoneChange}
        onProjectionTimezoneChange={handleProjectionTimezoneChange}
        onSchedulesChange={handleSchedulesChange}
        onShowAboutChange={handleShowAboutChange}
      />

      {showAbout ? (
        <About 
          setShowAbout={setShowAbout}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <CronSchedulePanel
              schedules={schedules}
              timezone={timezone}
              projectionTimezone={projectionTimezone}
              onSchedulesChange={setSchedules}
            />
          </div>
          <div>
            <ViewManager
              schedules={schedules}
              timezone={timezone}
              projectionTimezone={projectionTimezone}
            />
          </div>
        </div>
      )}
    </div>
  );
}
