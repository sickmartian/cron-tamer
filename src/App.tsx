import React, { useState } from 'react'
import { CronSchedule, TimeSlot } from './types'
import { CronScheduleTable } from './components/CronScheduleTable'
import { Calendar } from './components/Calendar'
import './App.css'

export default function App() {
  const [schedules, setSchedules] = useState<CronSchedule[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Cron Schedule Comparison</h1>
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
          />
        </div>
      </div>
    </div>
  )
}
