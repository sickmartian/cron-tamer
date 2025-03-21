import { XMarkIcon } from "@heroicons/react/24/outline";
import ReactMarkdown from "react-markdown";

const aboutContent = `
# Cron Tamer

A tool to visualize and compare cron schedules across different timezones.

## Features

- Visual representation of cron schedules
- Timezone comparison and projection
- Collision detection
- Shareable configurations
- Detailed day view
- Customizable application title so you can 'save' multiple environments

## How to Use

1. Add cron schedules using the table on the left
2. View the schedules in the calendar view
3. Click on any day for a detailed view
4. Change timezones to see how schedules align
5. Share your configuration using the Share button
6. Click the app's name to customize it

## About

This tool helps you understand how your cron schedules interact with each other and how they behave across different timezones.
It's particularly useful in case different jobs are sharing resources and need to be coordinated.
  `;

/**
 * About is a component that renders the about page
 * It contains the information about the app and how to use it
 */
export default function About({
  setShowAbout,
}: {
  setShowAbout: (show: boolean) => void;
}) {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-800 z-50 overflow-auto">
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowAbout(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown>{aboutContent}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
