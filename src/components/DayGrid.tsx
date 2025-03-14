import React, { useMemo } from 'react';
import { TimeSlot, CronSchedule } from '../types';

interface DayGridProps {
  timeSlots: TimeSlot[];
  schedules: CronSchedule[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
}

interface SlotBar {
  slot: TimeSlot;
  row: number;
  startSeconds: number;
  durationSeconds: number;
}

export function DayGrid({ timeSlots, schedules, selectedSlot, onSlotSelect }: DayGridProps) {
  const getSlotStyle = (slot: TimeSlot) => {
    const schedule = schedules.find((s) => s.id === slot.scheduleId);
    if (!schedule) return { backgroundColor: '#9CA3AF' };
    return { backgroundColor: schedule.color };
  };

  // Pre-calculate all bars for all slots
  const slotBars = useMemo(() => {
    const bars: SlotBar[] = [];
    
    timeSlots.forEach(slot => {
      const startHour = slot.start.getHours();
      const startMinute = slot.start.getMinutes();
      const startSecond = slot.start.getSeconds();
      const startSeconds = startMinute * 60 + startSecond;
      const durationSeconds = slot.duration * 60;
      
      bars.push({
        slot,
        row: startHour,
        startSeconds,
        durationSeconds
      });
    });
    
    return bars;
  }, [timeSlots]);

  return (
    <div className="grid grid-cols-1 gap-px bg-gray-100">
      {Array.from({ length: 24 }, (_, hour) => {
        // Find any bars that should be rendered in this hour
        const bars = slotBars.filter(bar => bar.row === hour);
        
        return (
          <div
            key={hour}
            className="h-8 bg-white relative"
          >
            {bars.map((bar) => {
              // Calculate position and width as percentages of the hour
              const startPercent = (bar.startSeconds / 3600) * 100;
              const widthPercent = (bar.durationSeconds / 3600) * 100;
              
              return (
                <div
                  key={`${bar.slot.key}-${bar.row}`}
                  className={`absolute h-2 cursor-pointer ${
                    selectedSlot?.key === bar.slot.key ? 'ring-2 ring-blue-500' : ''
                  }`}
                  style={{
                    ...getSlotStyle(bar.slot),
                    width: `${widthPercent}%`,
                    left: `${startPercent}%`,
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                  title={`${bar.slot.scheduleName} - ${bar.slot.start.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit',
                    timeZone: 'UTC' 
                  })} (${bar.slot.duration} minutes)`}
                  onClick={() => onSlotSelect(bar.slot)}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
} 