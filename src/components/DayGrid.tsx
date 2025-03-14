import React, { useMemo } from 'react';
import { TimeSlot, CronSchedule } from '../types';

interface DayGridProps {
  timeSlots: TimeSlot[];
  schedules: CronSchedule[];
  stepSize: number;
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
}

interface SlotPosition {
  slot: TimeSlot;
  row: number;
  col: number;
}

export function DayGrid({ timeSlots, schedules, stepSize, selectedSlot, onSlotSelect }: DayGridProps) {
  const getSlotStyle = (slot: TimeSlot) => {
    const schedule = schedules.find((s) => s.id === slot.scheduleId);
    if (!schedule) return { backgroundColor: '#9CA3AF' };
    return { backgroundColor: schedule.color };
  };

  // Pre-calculate all positions for all slots
  const slotPositions = useMemo(() => {
    const positions: SlotPosition[] = [];
    
    timeSlots.forEach(slot => {
      const startHour = slot.start.getHours();
      const startMinute = slot.start.getMinutes();
      const startCol = Math.floor(startMinute / stepSize);
      
      // Calculate how many positions we need to place
      let remainingPositions = slot.positions;
      let currentRow = startHour;
      let currentCol = startCol;
      
      while (remainingPositions > 0) {
        positions.push({
          slot,
          row: currentRow,
          col: currentCol
        });
        
        remainingPositions--;
        currentCol++;
        
        // Move to next row if we've filled the current one
        if (currentCol >= 6) {
          currentRow++;
          currentCol = 0;
        }
      }
    });
    
    return positions;
  }, [timeSlots, stepSize]);

  // Create a map of positions for quick lookup
  const positionMap = useMemo(() => {
    const map = new Map<string, SlotPosition[]>();
    slotPositions.forEach(pos => {
      const key = `${pos.row}-${pos.col}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(pos);
    });
    return map;
  }, [slotPositions]);

  return (
    <div className="grid grid-cols-6 gap-px bg-gray-100">
      {Array.from({ length: 24 }, (_, hour) =>
        Array.from({ length: 6 }, (_, col) => {
          const positions = positionMap.get(`${hour}-${col}`) || [];
          
          return (
            <div
              key={`${hour}-${col}`}
              className="aspect-square bg-white relative"
            >
              {positions.map((pos) => (
                <div
                  key={`${pos.slot.key}-${pos.row}-${pos.col}`}
                  className={`absolute w-2 h-2 rounded-full cursor-pointer ${
                    selectedSlot?.key === pos.slot.key ? 'ring-2 ring-blue-500' : ''
                  }`}
                  style={getSlotStyle(pos.slot)}
                  title={`${pos.slot.scheduleName} - ${pos.slot.start.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    timeZone: 'UTC' 
                  })}`}
                  onClick={() => onSlotSelect(pos.slot)}
                />
              ))}
            </div>
          );
        })
      )}
    </div>
  );
} 