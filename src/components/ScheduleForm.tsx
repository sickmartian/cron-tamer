import React, { useState } from 'react';
import { Schedule, ScheduleFormProps } from '../types';

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney'
];

export function ScheduleForm({ onSubmit, onDelete, schedules }: ScheduleFormProps) {
  const [name, setName] = useState('');
  const [cronExpression, setCronExpression] = useState('');
  const [duration, setDuration] = useState(30);
  const [isActive, setIsActive] = useState(true);
  const [timezone, setTimezone] = useState('UTC');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: Date.now().toString(),
      name,
      cronExpression,
      duration,
      isActive,
      timezone
    });
    setName('');
    setCronExpression('');
    setDuration(30);
    setIsActive(true);
    setTimezone('UTC');
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Add Schedule</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Cron Expression</label>
          <input
            type="text"
            value={cronExpression}
            onChange={(e) => setCronExpression(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="*/15 * * * *"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            min="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Timezone</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">Active</label>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add Schedule
        </button>
      </form>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Active Schedules</h3>
        <div className="space-y-2">
          {schedules.map((schedule: Schedule) => (
            <div
              key={schedule.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <div>
                <p className="font-medium">{schedule.name}</p>
                <p className="text-sm text-gray-600">{schedule.cronExpression}</p>
                <p className="text-sm text-gray-600">
                  {schedule.duration}min • {schedule.timezone}
                </p>
              </div>
              <button
                onClick={() => onDelete(schedule.id)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 