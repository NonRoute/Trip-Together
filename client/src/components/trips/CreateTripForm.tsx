"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { tripAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateTripFormData {
  title: string;
  description: string;
  destination: string;
}

export default function CreateTripForm() {
  const [days, setDays] = useState<string[]>([""]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTripFormData>();

  const addDay = () => {
    setDays([...days, ""]);
  };

  const removeDay = (index: number) => {
    if (days.length > 1) {
      setDays(days.filter((_, i) => i !== index));
    }
  };

  const updateDay = (index: number, value: string) => {
    const newDays = [...days];
    newDays[index] = value;
    setDays(newDays);
  };

  const onSubmit = async (data: CreateTripFormData) => {
    try {
      setError("");
      setIsSubmitting(true);

      const validDays = days.filter((day) => day.trim() !== "");
      if (validDays.length === 0) {
        setError("At least one day is required");
        return;
      }

      await tripAPI.createTrip({
        title: data.title,
        description: data.description || undefined,
        destination: data.destination || undefined,
        days: validDays,
      });

      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create trip");
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
            <div className="space-y-3">
              {days.map((day, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={day}
                    onChange={(e) => updateDay(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required={index === 0}
                  />
                  {days.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDay(index)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addDay}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add another day
              </button>
            </div>
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
