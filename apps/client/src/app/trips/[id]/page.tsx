"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { tripAPI, TripWithDays, TripDayWithSelections } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Calendar, MapPin, User, Plus, Trash2 } from "lucide-react";

export default function TripDetailPage() {
  const params = useParams();
  const tripId = Number(params.id);
  const [trip, setTrip] = useState<TripWithDays | null>(null);
  const [selectedDay, setSelectedDay] = useState<TripDayWithSelections | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSelectionForm, setShowSelectionForm] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [notes, setNotes] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const tripData = await tripAPI.getTrip(tripId);
        setTrip(tripData);
        if (tripData.days.length > 0) {
          const firstDay = await tripAPI.getTripDay(
            tripId,
            tripData.days[0].id,
          );
          setSelectedDay(firstDay);
        }
      } catch {
        setError("Failed to load trip");
      } finally {
        setLoading(false);
      }
    };

    if (tripId) {
      fetchTrip();
    }
  }, [tripId]);

  const handleDaySelect = async (dayId: number) => {
    try {
      const dayData = await tripAPI.getTripDay(tripId, dayId);
      setSelectedDay(dayData);
    } catch {
      setError("Failed to load day details");
    }
  };

  const handleCreateSelection = async () => {
    if (!selectedDay) return;

    try {
      await tripAPI.createDaySelection(tripId, selectedDay.tripDay.id, {
        guestName: guestName || undefined,
        notes: notes || undefined,
      });

      // Refresh the selected day
      const updatedDay = await tripAPI.getTripDay(
        tripId,
        selectedDay.tripDay.id,
      );
      setSelectedDay(updatedDay);

      // Reset form
      setGuestName("");
      setNotes("");
      setShowSelectionForm(false);
    } catch {
      setError("Failed to create selection");
    }
  };

  const handleDeleteSelection = async (selectionId: number) => {
    if (!selectedDay) return;

    try {
      await tripAPI.deleteDaySelection(
        tripId,
        selectedDay.tripDay.id,
        selectionId,
      );

      // Refresh the selected day
      const updatedDay = await tripAPI.getTripDay(
        tripId,
        selectedDay.tripDay.id,
      );
      setSelectedDay(updatedDay);
    } catch {
      setError("Failed to delete selection");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Trip not found
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Trip Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {trip.trip.title}
            </h1>
            {trip.trip.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {trip.trip.description}
              </p>
            )}
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              trip.trip.isActive
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
            }`}
          >
            {trip.trip.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trip.trip.destination && (
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <MapPin className="h-5 w-5 mr-2" />
              <span>{trip.trip.destination}</span>
            </div>
          )}
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Calendar className="h-5 w-5 mr-2" />
            <span>Created {formatDate(trip.trip.createdAt)}</span>
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <User className="h-5 w-5 mr-2" />
            <span>Creator ID: {trip.trip.creatorId}</span>
          </div>
        </div>
      </div>

      {/* Trip Days and Selections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Days List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Trip Days
            </h2>
            <div className="space-y-2">
              {trip.days.map((day) => (
                <button
                  key={day.id}
                  onClick={() => handleDaySelect(day.id)}
                  className={`w-full text-left p-3 rounded-md border transition-colors ${
                    selectedDay?.tripDay.id === day.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {formatDate(day.day)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedDay?.tripDay.id === day.id
                      ? `${selectedDay.selections.length} selections`
                      : "Click to view"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Day Details */}
        <div className="lg:col-span-2">
          {selectedDay ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {formatDate(selectedDay.tripDay.day)}
                </h2>
                <button
                  onClick={() => setShowSelectionForm(!showSelectionForm)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Selection
                </button>
              </div>

              {/* Selection Form */}
              {showSelectionForm && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Add Your Selection
                  </h3>
                  <div className="space-y-4">
                    {!user && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Your Name
                        </label>
                        <input
                          type="text"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter your name"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notes (optional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Add any notes or comments"
                      />
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleCreateSelection}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Submit
                      </button>
                      <button
                        onClick={() => setShowSelectionForm(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Selections List */}
              <div className="space-y-4">
                {selectedDay.selections.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No selections yet. Be the first to join!
                  </p>
                ) : (
                  selectedDay.selections.map((selection) => (
                    <div
                      key={selection.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-md p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {selection.guestName || `User ${selection.userId}`}
                          </div>
                          {selection.notes && (
                            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                              {selection.notes}
                            </p>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Added {formatDate(selection.createdAt)}
                          </div>
                        </div>
                        {user &&
                          (selection.userId === user.id ||
                            !selection.userId) && (
                            <button
                              onClick={() =>
                                handleDeleteSelection(selection.id)
                              }
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select a day
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Choose a day from the list to view and manage selections.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
