"use client";

import Calendar from "@/components/ui/Calendar";
import { tripAPI } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface CreateTripFormData {
  title: string;
  description: string;
  destination: string;
}

export default function CreateTripForm() {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTripFormData>();

  const handleDateSelect = (date: string) => {
    setSelectedDates((prev) => [...prev, date].sort());
  };

  const handleDateDeselect = (date: string) => {
    setSelectedDates((prev) => prev.filter((d) => d !== date));
  };

  const onSubmit = async (data: CreateTripFormData) => {
    try {
      setError("");
      setIsSubmitting(true);

      if (selectedDates.length === 0) {
        setError("At least one day is required");
        return;
      }

      await tripAPI.createTrip({
        title: data.title,
        description: data.description || undefined,
        destination: data.destination || undefined,
        days: selectedDates,
      });

      router.push("/");
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        setError(axiosError.response?.data?.error || "Failed to create trip");
      } else {
        setError("Failed to create trip");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          Create New Trip
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Trip Title *
            </label>
            <input
              {...register("title", {
                required: "Title is required",
                minLength: {
                  value: 1,
                  message: "Title must not be empty",
                },
              })}
              type="text"
              id="title"
              className={cn(
                "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                errors.title ? "border-red-300" : "border-gray-300",
              )}
              placeholder="Enter trip title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Description
            </label>
            <textarea
              {...register("description")}
              id="description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter trip description (optional)"
            />
          </div>

          <div>
            <label
              htmlFor="destination"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Destination
            </label>
            <input
              {...register("destination")}
              type="text"
              id="destination"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter destination (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Trip Days *
            </label>

            {/* Selected dates display */}
            {selectedDates.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Selected Dates ({selectedDates.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedDates([])}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                  >
                    Clear all
                  </button>
                </div>
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
                      <button
                        type="button"
                        onClick={() => handleDateDeselect(date)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Calendar toggle button */}
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              {showCalendar ? "Hide Calendar" : "Select Trip Days"}
            </button>

            {/* Calendar component */}
            {showCalendar && (
              <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
                <Calendar
                  selectedDates={selectedDates}
                  onDateSelect={handleDateSelect}
                  onDateDeselect={handleDateDeselect}
                />
              </div>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create Trip"
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
