import React, { useState } from 'react';
import { CronSchedule } from '../types';
import { generateColor } from '../utils';

interface CronScheduleTableProps {
  schedules: CronSchedule[];
  onAddSchedule: (schedule: CronSchedule) => void;
  onUpdateSchedule: (schedule: CronSchedule) => void;
  onDeleteSchedule: (id: string) => void;
}

export const CronScheduleTable: React.FC<CronScheduleTableProps> = ({
  schedules,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
}) => {
  const [newSchedule, setNewSchedule] = useState<Partial<CronSchedule>>({
    name: '',
    expression: '',
    duration: 30,
    isActive: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedule.name || !newSchedule.expression) return;

    const schedule: CronSchedule = {
      id: crypto.randomUUID(),
      name: newSchedule.name,
      expression: newSchedule.expression,
      duration: newSchedule.duration || 30,
      isActive: true,
      color: generateColor(schedules.length),
    };

    onAddSchedule(schedule);
    setNewSchedule({
      name: '',
      expression: '',
      duration: 30,
      isActive: true,
    });
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Cron Schedules</h2>
      
      <form onSubmit={handleSubmit} className="mb-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Schedule Name"
            value={newSchedule.name}
            onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
            className="p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Cron Expression"
            value={newSchedule.expression}
            onChange={(e) => setNewSchedule({ ...newSchedule, expression: e.target.value })}
            className="p-2 border rounded"
          />
          <input
            type="number"
            placeholder="Duration (minutes)"
            value={newSchedule.duration}
            onChange={(e) => setNewSchedule({ ...newSchedule, duration: parseInt(e.target.value) })}
            className="p-2 border rounded"
          />
          <button
            type="submit"
            className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Schedule
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="flex items-center justify-between p-2 border rounded"
            style={{ backgroundColor: schedule.color + '20' }}
          >
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={schedule.isActive}
                onChange={(e) =>
                  onUpdateSchedule({ ...schedule, isActive: e.target.checked })
                }
                className="w-4 h-4"
              />
              <span className="font-medium">{schedule.name}</span>
              <span className="text-sm text-gray-600">{schedule.expression}</span>
              <span className="text-sm text-gray-600">{schedule.duration}min</span>
            </div>
            <button
              onClick={() => onDeleteSchedule(schedule.id)}
              className="p-1 text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}; 