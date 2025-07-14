"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

  // Generate next 30 days from today
  const generateDays = () => {
    const days = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }

    return days;
  };

  const days = generateDays();

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

  const handleDateClick = (date: Date) => {
    const dateString = formatDate(date);
    if (isSelected(date)) {
      onDateDeselect(dateString);
    } else {
      onDateSelect(dateString);
    }
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // Group days by month
  const groupDaysByMonth = () => {
    const groups: { [key: string]: Date[] } = {};

    days.forEach((day) => {
      const monthKey = day.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(day);
    });

    return groups;
  };

  const monthGroups = groupDaysByMonth();

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

      {Object.entries(monthGroups).map(([monthName, monthDays]) => (
        <div key={monthName} className="space-y-4">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white text-center">
            {monthName}
          </h4>

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

            {/* Empty cells for days before the first day of the month */}
            {(() => {
              const firstDay = monthDays[0];
              const dayOfWeek = firstDay.getDay();
              return Array.from({ length: dayOfWeek }, (_, i) => (
                <div key={`empty-${i}`} className="h-10" />
              ));
            })()}

            {/* Calendar days */}
            {monthDays.map((day, index) => (
              <button
                key={index}
                onClick={() => handleDateClick(day)}
                className={cn(
                  "h-10 w-full rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  isSelected(day)
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : isToday(day)
                    ? "bg-blue-100 text-blue-900 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800"
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
      ))}

      {selectedDates.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Selected Dates ({selectedDates.length})
          </h5>
          <div className="flex flex-wrap gap-2">
            {selectedDates.map((date) => (
              <span
                key={date}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
              >
                {new Date(date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
