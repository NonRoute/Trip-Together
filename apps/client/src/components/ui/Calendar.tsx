"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

interface CalendarProps {
  selectedDates: string[];
  joinedDates: string[];
  onDateSelect: (date: string) => void;
  onDateDeselect: (date: string) => void;
  selectionCounts?: Record<string, number>;
  availableDates?: string[];
  disableDayLogic?: boolean;
}

export default function Calendar({
  selectedDates,
  joinedDates = [],
  onDateSelect,
  onDateDeselect,
  selectionCounts = {},
  availableDates = [],
  disableDayLogic = true,
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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isSelected = (date: Date) => {
    return selectedDates.includes(formatDate(date));
  };

  const isAvailable = (date: Date) => {
    return availableDates.includes(formatDate(date));
  };

  const hasJoined = (date: Date) => joinedDates.includes(formatDate(date));

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

  const getSelectionCount = (date: Date) => {
    const dateString = formatDate(date);
    return selectionCounts[dateString] || 0;
  };

  const handleDateClick = (date: Date) => {
    const dateString = formatDate(date);

    // In trip creation mode, allow all dates
    if (!disableDayLogic) {
      if (isSelected(date)) {
        onDateDeselect(dateString);
      } else {
        onDateSelect(dateString);
      }
      return;
    }

    // In trip joining mode, only allow available dates
    if (!isAvailable(date)) return;

    if (isSelected(date)) {
      onDateDeselect(dateString);
    } else {
      onDateSelect(dateString);
    }
  };

  // Determine if day should be clickable
  const isDayClickable = (date: Date) => {
    if (!disableDayLogic) return true; // Trip creation: all days clickable
    return isAvailable(date); // Trip joining: only available days clickable
  };

  // Determine day styling
  const getDayStyles = (date: Date) => {
    const selected = isSelected(date);
    const joined = hasJoined(date);
    const available = isAvailable(date);
    const today = isToday(date);
    const currentMonth = isCurrentMonth(date);
    const clickable = isDayClickable(date);

    // Selected days (highest priority)
    if (selected) {
      return "bg-blue-600 text-white hover:bg-blue-700 border-2 border-blue-500";
    }

    // Joined days (already participated)
    if (joined) {
      return "border-2 border-green-500 text-gray-900 dark:text-white bg-green-700 cursor-not-allowed";
    }

    // Available days (can be selected)
    if (available) {
      return "text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 border-2 border-green-300";
    }

    // Days from other months (not clickable)
    if (!currentMonth) {
      return "text-gray-300 dark:text-gray-600 cursor-not-allowed";
    }

    // Current month but not available/clickable
    if (!clickable) {
      return "text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50";
    }

    // Default case (shouldn't happen but fallback)
    return "text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700";
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

  const currentMonthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {disableDayLogic ? "Select Available Trip Days" : "Select Trip Days"}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {disableDayLogic
            ? "Click on available dates to select or deselect them"
            : "Click on any date to select or deselect it"}
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
          {days.map((day, index) => {
            const selectionCount = getSelectionCount(day);
            const hasSelections = selectionCount > 0;
            const clickable = isDayClickable(day);
            const available = isAvailable(day);
            const today = isToday(day);

            return (
              <button
                key={index}
                onClick={() => handleDateClick(day)}
                disabled={!clickable}
                className={cn(
                  "h-12 w-full rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 relative cursor-pointer",
                  getDayStyles(day),
                )}
              >
                <div className="flex flex-col items-center h-full justify-center">
                  <span>{day.getDate()}</span>
                  {today && available && (
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Today
                    </span>
                  )}
                  {hasSelections && (
                    <span className="text-xs text-green-600 dark:text-green-400">
                      {selectionCount} Joins
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
          {disableDayLogic && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-green-300 rounded"></div>
              <span>Available</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span>Selected</span>
          </div>
          {disableDayLogic && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-green-500 rounded"></div>
              <span>Joined</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
