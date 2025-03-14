import { useState } from 'react'
import { CronSchedule, GridConfig } from './types'
import { CronScheduleTable } from './components/CronScheduleTable'
import { Calendar } from './components/Calendar'
import './App.css'

function App() {
  const [schedules, setSchedules] = useState<CronSchedule[]>([])
  const [gridConfig, setGridConfig] = useState<GridConfig>({ stepSize: 10 })

  const handleAddSchedule = (schedule: CronSchedule) => {
    setSchedules([...schedules, schedule])
  }

  const handleUpdateSchedule = (updatedSchedule: CronSchedule) => {
    setSchedules(
      schedules.map((schedule) =>
        schedule.id === updatedSchedule.id ? updatedSchedule : schedule
      )
    )
  }

  const handleDeleteSchedule = (id: string) => {
    setSchedules(schedules.filter((schedule) => schedule.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Cron Schedule Visualizer</h1>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grid Step Size (minutes):
          </label>
          <select
            value={gridConfig.stepSize}
            onChange={(e) => setGridConfig({ stepSize: parseInt(e.target.value) })}
            className="p-2 border rounded"
          >
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Calendar schedules={schedules} config={gridConfig} />
          </div>
          <div>
            <CronScheduleTable
              schedules={schedules}
              onAddSchedule={handleAddSchedule}
              onUpdateSchedule={handleUpdateSchedule}
              onDeleteSchedule={handleDeleteSchedule}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
