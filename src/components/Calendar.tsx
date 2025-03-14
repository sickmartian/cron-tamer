import React, { useState } from 'react';
import { CronSchedule, TimeSlot, GridConfig } from '../types';
import { generateTimeSlots } from '../utils';
import { DayGrid } from './DayGrid';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarProps {
  schedules: CronSchedule[];
  config: GridConfig;
}

export function Calendar({ schedules, config }: CalendarProps) {
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const timeSlots = generateTimeSlots(schedules);

  const getSlotStyle = (slot: TimeSlot) => {
    if (slot.isSelfCollision) {
      return 'bg-red-500 hover:bg-red-600';
    }
    if (slot.isCollision) {
      return 'bg-yellow-500 hover:bg-yellow-600';
    }
    return 'bg-green-500 hover:bg-green-600';
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: 42 }, (_, i) => {
    const dayNumber = i - firstDayOfMonth + 1;
    return dayNumber > 0 && dayNumber <= daysInMonth ? dayNumber : null;
  });

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded"
          >
            ←
          </button>
          <h2 className="text-xl font-semibold">{getMonthName(currentDate)}</h2>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded"
          >
            →
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {/* Day headers */}
        {DAYS.map((day) => (
          <div key={day} className="bg-white p-2 text-center font-semibold">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, index) => (
          <div
            key={index}
            className={`bg-white min-h-[200px] p-2 ${
              day === null ? 'bg-gray-50' : ''
            }`}
          >
            {day && (
              <>
                <div className="text-sm font-medium mb-2">{day}</div>
                <div className="h-[calc(100%-2rem)]">
                  <DayGrid
                    timeSlots={timeSlots.filter(
                      (slot) =>
                        slot.start.getDate() === day &&
                        slot.start.getMonth() === currentDate.getMonth() &&
                        slot.start.getFullYear() === currentDate.getFullYear()
                    )}
                    stepSize={config.stepSize}
                    selectedSlot={selectedSlot}
                    onSlotSelect={setSelectedSlot}
                  />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 