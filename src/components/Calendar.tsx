import React, { useState } from 'react';
import { CronSchedule, TimeSlot, GridConfig } from '../types';
import { generateTimeSlots } from '../utils';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarProps {
  schedules: CronSchedule[];
  config: GridConfig;
}

export function Calendar({ schedules }: CalendarProps) {
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
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

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b">
        <div className="p-2" /> {/* Empty cell for time column */}
        {DAYS.map((day) => (
          <div key={day} className="p-2 text-center font-semibold border-l">
            {day}
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)]">
        {/* Time labels */}
        <div className="border-r">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="h-8 text-sm text-gray-600 flex items-center justify-end pr-2"
            >
              {hour.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Day columns */}
        {DAYS.map((day) => (
          <div key={day} className="relative border-l">
            {/* Hour lines */}
            {HOURS.map((hour) => (
              <div key={hour} className="h-8 border-b border-gray-100" />
            ))}

            {/* Time slots */}
            {timeSlots
              .filter((slot) => slot.start.getDay() === DAYS.indexOf(day))
              .map((slot) => {
                const hour = slot.start.getHours();
                const minute = slot.start.getMinutes();
                const top = hour * 32 + (minute / 60) * 32; // 32px per hour (8px per 15 minutes)

                return (
                  <div
                    key={slot.key}
                    className={`absolute w-2 h-2 rounded-full cursor-pointer ${
                      getSlotStyle(slot)
                    } ${
                      selectedSlot?.key === slot.key ? 'ring-2 ring-blue-500' : ''
                    }`}
                    style={{ top: `${top}px` }}
                    onClick={() => setSelectedSlot(slot)}
                    title={`${slot.scheduleName} (${slot.start.toLocaleTimeString()} - ${slot.end.toLocaleTimeString()})`}
                  />
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
} 