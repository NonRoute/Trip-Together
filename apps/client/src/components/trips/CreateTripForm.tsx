"use client";

import Calendar from "@/components/ui/Calendar";
import { tripAPI } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Loader2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface CreateTripFormData {
  title: string;
  description: string;
  destination: string;
}

interface TripDetailsStepProps {
  formData: CreateTripFormData;
  onNext: (data: CreateTripFormData) => void;
  onCancel: () => void;
}

interface DateSelectionStepProps {
  selectedDates: string[];
  onDateSelect: (date: string) => void;
  onDateDeselect: (date: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error: string;
}

function TripDetailsStep({ formData, onNext, onCancel }: TripDetailsStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTripFormData>({
    defaultValues: formData,
  });

  const handleNext = (data: CreateTripFormData) => {
    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(handleNext)} className="space-y-6">
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
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
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

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={Object.keys(errors).length !== 0}
          className={cn(
            "flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
            Object.keys(errors).length !== 0 && "opacity-50 cursor-not-allowed",
          )}
        >
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

function DateSelectionStep({
  selectedDates,
  onDateSelect,
  onDateDeselect,
  onBack,
  onSubmit,
  isSubmitting,
  error,
}: DateSelectionStepProps) {
  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

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
                onClick={() => {
                  selectedDates.forEach((date) => onDateDeselect(date));
                }}
                className="text-xs text-blue-400 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
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
                    onClick={() => onDateDeselect(date)}
                    className="ml-1 text-blue-400 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Calendar component */}
        <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
          <Calendar
            selectedDates={selectedDates}
            onDateSelect={onDateSelect}
            onDateDeselect={onDateDeselect}
          />
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || selectedDates.length === 0}
          className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Create Trip"
          )}
        </button>
      </div>
    </div>
  );
}

export default function CreateTripForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CreateTripFormData>({
    title: "",
    description: "",
    destination: "",
  });
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleDateSelect = (date: string) => {
    setSelectedDates((prev) => [...prev, date].sort());
  };

  const handleDateDeselect = (date: string) => {
    setSelectedDates((prev) => prev.filter((d) => d !== date));
  };

  const handleNext = (data: CreateTripFormData) => {
    setFormData(data);
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleCancel = () => {
    router.back();
  };

  const handleSubmit = async () => {
    try {
      setError("");
      setIsSubmitting(true);

      if (selectedDates.length === 0) {
        setError("At least one day is required");
        return;
      }

      await tripAPI.createTrip({
        title: formData.title,
        description: formData.description || undefined,
        destination: formData.destination || undefined,
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
    <div className="w-full grow flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 grow max-w-lg">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
            Create New Trip
          </h2>

          {/* Step indicator */}
          <div className="flex items-center justify-center space-x-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                1
              </div>
              <span
                className={`mt-1 text-sm font-medium ${
                  currentStep >= 1 ? "text-blue-400" : "text-gray-400"
                }`}
              >
                Trip Details
              </span>
            </div>
            <div
              className={`w-8 h-1 ${
                currentStep >= 2 ? "bg-blue-600" : "bg-gray-200"
              }`}
            ></div>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= 2
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                2
              </div>
              <span
                className={`mt-1 text-sm font-medium ${
                  currentStep >= 2 ? "text-blue-400" : "text-gray-400"
                }`}
              >
                Select Dates
              </span>
            </div>
          </div>
        </div>

        {currentStep === 1 ? (
          <TripDetailsStep
            formData={formData}
            onNext={handleNext}
            onCancel={handleCancel}
          />
        ) : (
          <DateSelectionStep
            selectedDates={selectedDates}
            onDateSelect={handleDateSelect}
            onDateDeselect={handleDateDeselect}
            onBack={handleBack}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={error}
          />
        )}
      </div>
    </div>
  );
}
