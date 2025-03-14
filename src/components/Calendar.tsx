import { useState } from 'react';
import { CronSchedule, TimeSlot } from '../types';
import { generateTimeSlots } from '../utils';
import { DayGrid } from './DayGrid';
import { DateTime } from 'luxon';

interface CalendarProps {
  schedules: CronSchedule[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
  timezone: string;
}

export function Calendar({ schedules, selectedSlot, onSlotSelect, timezone }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const timeSlots = generateTimeSlots(schedules, currentDate, timezone);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">{monthName}</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            onClick={handleNextMonth}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-100">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-2 text-sm font-medium text-center text-gray-500 bg-white">
            {day}
          </div>
        ))}
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} className="bg-white" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          // get the user's current day for the calendar month we are looking at
          const currentDay = DateTime.fromJSDate(currentDate).set({day: i + 1}).setZone(timezone, { keepLocalTime: true });
          const daySlots = timeSlots.filter(slot => {
            return slot.start.hasSame(currentDay, 'day');
          });

          return (
            <div key={i} className="min-h-[200px] bg-white p-2">
              <div className="text-sm font-medium mb-2">{i + 1}</div>
              <DayGrid
                timeSlots={daySlots}
                schedules={schedules}
                selectedSlot={selectedSlot}
                onSlotSelect={onSlotSelect}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
} 