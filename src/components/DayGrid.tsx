import React from 'react';
import { TimeSlot, CronSchedule } from '../types';

interface DayGridProps {
  timeSlots: TimeSlot[];
  schedules: CronSchedule[];
  stepSize: number;
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
}

export function DayGrid({ timeSlots, schedules, stepSize, selectedSlot, onSlotSelect }: DayGridProps) {
  const getSlotStyle = (slot: TimeSlot) => {
    const schedule = schedules.find(s => s.id === slot.scheduleId);
    if (!schedule) return { backgroundColor: '#9CA3AF' }; // gray-400
    
    return {
      backgroundColor: schedule.color,
      opacity: 1,
      transition: 'opacity 0.2s'
    };
  };

  const getSlotPositions = (slot: TimeSlot) => {
    const startHour = slot.start.getHours();
    const startMinute = slot.start.getMinutes();
    const endHour = slot.end.getHours();
    const endMinute = slot.end.getMinutes();

    const positions: { row: number; col: number }[] = [];
    let currentHour = startHour;
    let currentMinute = startMinute;

    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMinute < endMinute)
    ) {
      positions.push({
        row: currentHour,
        col: Math.floor(currentMinute / stepSize)
      });

      currentMinute += stepSize;
      if (currentMinute >= 60) {
        currentHour += 1;
        currentMinute = 0;
      }
    }

    return positions;
  };

  return (
    <div className="grid grid-cols-6 grid-rows-24 gap-0.5 w-full h-full">
      {Array.from({ length: 24 * 6 }, (_, i) => {
        const row = Math.floor(i / 6);
        const col = i % 6;
        const timeSlotsInCell = timeSlots.flatMap(slot => {
          const positions = getSlotPositions(slot);
          return positions
            .filter(pos => pos.row === row && pos.col === col)
            .map(() => slot);
        });

        return (
          <div key={i} className="relative w-full h-full">
            {timeSlotsInCell.map((slot, index) => (
              <div
                key={`${slot.key}-${index}`}
                className={`absolute w-1.5 h-1.5 rounded-full cursor-pointer ${
                  selectedSlot?.key === slot.key ? 'ring-1 ring-blue-500' : ''
                }`}
                style={{
                  ...getSlotStyle(slot),
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                onClick={() => onSlotSelect(slot)}
                title={`${slot.scheduleName} (${slot.start.toLocaleTimeString()} - ${slot.end.toLocaleTimeString()})`}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
} 