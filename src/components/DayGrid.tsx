import React from 'react';
import { TimeSlot } from '../types';

interface DayGridProps {
  timeSlots: TimeSlot[];
  stepSize: number;
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
}

export function DayGrid({ timeSlots, stepSize, selectedSlot, onSlotSelect }: DayGridProps) {
  const getSlotStyle = (slot: TimeSlot) => {
    if (slot.isSelfCollision) {
      return 'bg-red-500 hover:bg-red-600';
    }
    if (slot.isCollision) {
      return 'bg-yellow-500 hover:bg-yellow-600';
    }
    return 'bg-green-500 hover:bg-green-600';
  };

  const getSlotPosition = (slot: TimeSlot) => {
    const hour = slot.start.getHours();
    const minute = slot.start.getMinutes();
    const col = Math.floor(minute / stepSize);
    const row = hour;
    return { row, col };
  };

  return (
    <div className="grid grid-cols-6 grid-rows-24 gap-0.5 w-full h-full">
      {Array.from({ length: 24 * 6 }, (_, i) => {
        const row = Math.floor(i / 6);
        const col = i % 6;
        const timeSlotsInCell = timeSlots.filter(slot => {
          const pos = getSlotPosition(slot);
          return pos.row === row && pos.col === col;
        });

        return (
          <div key={i} className="relative w-full h-full">
            {timeSlotsInCell.map(slot => (
              <div
                key={slot.key}
                className={`absolute w-1.5 h-1.5 rounded-full cursor-pointer ${
                  getSlotStyle(slot)
                } ${
                  selectedSlot?.key === slot.key ? 'ring-1 ring-blue-500' : ''
                }`}
                style={{
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
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