import { useState } from 'react'
import { CronSchedule, GridConfig } from './types'
import { CronScheduleTable } from './components/CronScheduleTable'
import { Calendar } from './components/Calendar'
import './App.css'

export default function App() {
  const [schedules, setSchedules] = useState<CronSchedule[]>([])
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [config, setConfig] = useState<GridConfig>({
    stepSize: 10,
    timezone: 'UTC'
  })

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-4">Cron Schedule Comparison</h1>
        <div className="flex items-center space-x-4 mb-4">
          <label className="flex items-center space-x-2">
            <span>Grid Step Size (minutes):</span>
            <input
              type="number"
              min="1"
              max="60"
              value={config.stepSize}
              onChange={(e) => setConfig({ ...config, stepSize: parseInt(e.target.value) })}
              className="border rounded px-2 py-1"
            />
          </label>
          <label className="flex items-center space-x-2">
            <span>Timezone:</span>
            <select
              value={config.timezone}
              onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
              className="border rounded px-2 py-1"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </label>
        </div>
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
            config={config}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>
      </div>
    </div>
  )
}
