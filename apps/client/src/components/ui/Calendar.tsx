"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

interface CalendarProps {
  selectedDates: string[];
  onDateSelect: (date: string) => void;
  onDateDeselect: (date: string) => void;
}

export default function Calendar({
  selectedDates,
  onDateSelect,
  onDateDeselect,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Generate calendar days for the current month
  const generateDaysForMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    // Get first day of the month
    const firstDay = new Date(year, month, 1);
    // Get last day of the month
    const lastDay = new Date(year, month + 1, 0);

    const days = [];

    // Add days from previous month to fill the first week
    const firstDayOfWeek = firstDay.getDay();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push(prevDate);
    }

    // Add all days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    // Add days from next month to fill the last week
    const lastDayOfWeek = lastDay.getDay();
    for (let i = 1; i <= 6 - lastDayOfWeek; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push(nextDate);
    }

    return days;
  };

  const days = generateDaysForMonth(currentDate);

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const isSelected = (date: Date) => {
    return selectedDates.includes(formatDate(date));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return (
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear()
    );
  };

  const handleDateClick = (date: Date) => {
    const dateString = formatDate(date);
    if (isSelected(date)) {
      onDateDeselect(dateString);
    } else {
      onDateSelect(dateString);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const currentMonthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Select Trip Days
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Click on dates to select or deselect them
        </p>
      </div>

      <div className="space-y-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              {currentMonthName}
            </h4>
          </div>

          <button
            onClick={goToNextMonth}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="h-8 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400"
            >
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day, index) => (
            <button
              key={index}
              onClick={() => handleDateClick(day)}
              className={cn(
                "h-10 w-full rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                isSelected(day)
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : isToday(day)
                  ? "bg-blue-100 text-blue-900 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800"
                  : !isCurrentMonth(day)
                  ? "text-gray-400 hover:bg-gray-50 dark:text-gray-500 dark:hover:bg-gray-800"
                  : "text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700",
              )}
            >
              <div className="flex flex-col items-center">
                <span>{day.getDate()}</span>
                {isToday(day) && (
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    Today
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
