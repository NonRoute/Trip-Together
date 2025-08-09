"use client";

import CalendarComponent from "@/components/ui/Calendar";
import { useAuth } from "@/contexts/AuthContext";
import { tripAPI, TripWithDaysAndSelections } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import {
  Calendar,
  Check,
  Loader2,
  MapPin,
  Plus,
  User,
  X,
  Trash2,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function TripDetailPage() {
  const params = useParams();
  const tripId = Number(params.id);
  const [trip, setTrip] = useState<TripWithDaysAndSelections | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [daysToDeselect, setDaysToDeselect] = useState<string[]>([]);
  const [guestName, setGuestName] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeselecting, setIsDeselecting] = useState(false);
  const [selectionCounts, setSelectionCounts] = useState<
    Record<string, number>
  >({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [confirmedSelections, setConfirmedSelections] = useState<string[]>([]);
  const [userSelectedDays, setUserSelectedDays] = useState<string[]>([]);
  const [userSelectionIds, setUserSelectionIds] = useState<
    Record<string, number>
  >({});
  const [guestNameConfirmed, setGuestNameConfirmed] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const tripData = await tripAPI.getTrip(tripId);
        setTrip(tripData);

        // Calculate selection counts from the trip data
        const counts: Record<string, number> = {};
        const userSelections: string[] = [];
        const userSelectionIdMap: Record<string, number> = {};

        tripData.days.forEach(
          (dayWithSelections: TripWithDaysAndSelections["days"][0]) => {
            counts[dayWithSelections.tripDay.day] =
              dayWithSelections.selections.length;

            // Check if current user has already selected this day
            const userSelection = dayWithSelections.selections.find(
              (selection) => {
                if (user) {
                  // For logged-in users, check by userId
                  return selection.userId === user.id;
                } else {
                  // For guest users, check by guestName (only if guestName is set)
                  return guestName && selection.guestName === guestName;
                }
              },
            );

            if (userSelection) {
              userSelections.push(dayWithSelections.tripDay.day);
              if (user && userSelection.id) {
                userSelectionIdMap[dayWithSelections.tripDay.day] =
                  userSelection.id;
              }
            }
          },
        );

        setSelectionCounts(counts);
        setUserSelectedDays(userSelections);
        setUserSelectionIds(userSelectionIdMap);
      } catch {
        setError("Failed to load trip");
      } finally {
        setLoading(false);
      }
    };

    if (tripId) {
      fetchTrip();
    }
  }, [tripId, user, guestName]);

  const handleDateSelect = (date: string) => {
    // Don't allow selecting days that the user has already selected
    if (userSelectedDays.includes(date)) {
      return;
    }
    setSelectedDays((prev) => [...prev, date].sort());
  };

  const handleDateDeselect = (date: string) => {
    setSelectedDays((prev) => prev.filter((d) => d !== date));
  };

  const handleDeselectDay = (date: string) => {
    setDaysToDeselect((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date],
    );
  };

  const handleBulkChanges = async () => {
    if (selectedDays.length === 0 && daysToDeselect.length === 0) return;

    // Validate guest name for non-logged-in users
    if (!user && !guestName.trim()) {
      setError("Please enter your name to join the trip");
      return;
    }

    setIsSubmitting(true);
    setIsDeselecting(true);
    setError("");

    try {
      // First, handle deselections
      if (daysToDeselect.length > 0) {
        const deselectPromises = daysToDeselect.map(async (date) => {
          const selectionId = userSelectionIds[date];
          if (!selectionId) return;

          // Find the trip day ID for this date
          const tripDayWithSelections = trip?.days.find(
            (dayWithSelections) => dayWithSelections.tripDay.day === date,
          );
          if (!tripDayWithSelections) return;

          await tripAPI.deleteDaySelection(
            tripId,
            tripDayWithSelections.tripDay.id,
            selectionId,
          );
        });

        await Promise.all(deselectPromises);
      }

      // Then, handle new selections
      if (selectedDays.length > 0) {
        const selectPromises = selectedDays.map(async (date) => {
          // Find the trip day ID for this date
          const tripDayWithSelections = trip?.days.find(
            (dayWithSelections) => dayWithSelections.tripDay.day === date,
          );
          if (!tripDayWithSelections) return;

          if (user) {
            // For logged-in users, use the authenticated endpoint
            await tripAPI.createDaySelection(
              tripId,
              tripDayWithSelections.tripDay.id,
              {
                notes: notes || undefined,
              },
            );
          } else {
            // For guest users, use the guest endpoint
            await tripAPI.createGuestDaySelection(
              tripId,
              tripDayWithSelections.tripDay.id,
              {
                guestName: guestName.trim(),
                notes: notes || undefined,
              },
            );
          }
        });

        await Promise.all(selectPromises);
      }

      // Store confirmed selections for success screen
      setConfirmedSelections([...selectedDays]);

      // Refresh trip data and selection counts
      const updatedTrip = await tripAPI.getTrip(tripId);
      setTrip(updatedTrip);

      // Update selection counts and user selections
      const counts: Record<string, number> = {};
      const newUserSelections: string[] = [];
      const newUserSelectionIdMap: Record<string, number> = {};
      updatedTrip.days.forEach(
        (dayWithSelections: TripWithDaysAndSelections["days"][0]) => {
          counts[dayWithSelections.tripDay.day] =
            dayWithSelections.selections.length;
          // Check if current user has already selected this day
          const userSelection = dayWithSelections.selections.find(
            (selection) => {
              if (user) {
                return selection.userId === user.id;
              } else {
                return guestName && selection.guestName === guestName;
              }
            },
          );
          if (userSelection) {
            newUserSelections.push(dayWithSelections.tripDay.day);
            if (user && userSelection.id) {
              newUserSelectionIdMap[dayWithSelections.tripDay.day] =
                userSelection.id;
            }
          }
        },
      );
      setSelectionCounts(counts);
      setUserSelectedDays(newUserSelections);
      setUserSelectionIds(newUserSelectionIdMap);

      // Reset form and show success
      setSelectedDays([]);
      setDaysToDeselect([]);
      // Don't clear guest name for guests, just clear notes
      if (user) {
        setGuestName("");
      }
      setNotes("");
      setShowSuccess(true);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError("You have already selected one or more of these days");
      } else {
        setError("Failed to update selections");
      }
    } finally {
      setIsSubmitting(false);
      setIsDeselecting(false);
    }
  };

  // Helper to get the guest's selected day (for guests only)
  // Only check for existing selection after guestName is confirmed
  const guestSelectedDay =
    !user && guestNameConfirmed && userSelectedDays.length > 0
      ? userSelectedDays[0]
      : null;

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

      {/* Day Selection Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        {showSuccess ? (
          /* Success Screen */
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {confirmedSelections.length > 0
                  ? "Successfully selected!"
                  : "Successfully updated!"}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {confirmedSelections.length > 0
                  ? "You have successfully selected available days for this trip."
                  : "Your selections have been updated successfully."}
              </p>
            </div>

            {confirmedSelections.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Your Selected Days:
                </h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {confirmedSelections.map((date) => (
                    <div
                      key={date}
                      className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowSuccess(false);
                  // Preserve guest name when selecting more days
                  if (!user) {
                    setGuestNameConfirmed(true);
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                {confirmedSelections.length > 0
                  ? "Select More Days"
                  : "Continue"}
              </button>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                You can always come back to manage your selections later.
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Select Your Available Days
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Choose the days you&apos;re available for this trip
                </p>
              </div>
            </div>

            {/* After confirming name, show selection UI or already selected message */}
            {!user && guestNameConfirmed && guestSelectedDay ? (
              <div className="mb-6 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-md text-center">
                <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  You have already selected your available day for this trip
                </h3>
                <div className="text-md text-gray-800 dark:text-gray-100 mb-2">
                  <Calendar className="inline h-5 w-5 mr-1" />
                  <span className="font-semibold">
                    {formatDate(guestSelectedDay)}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  If you need to change your selection, please contact the trip
                  organizer.
                </div>
                <button
                  className="mt-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                  onClick={() => setGuestNameConfirmed(false)}
                >
                  Change Name
                </button>
              </div>
            ) : null}

            {/* Guest Name Input - Show when guest hasn't confirmed name yet */}
            {!user && !guestNameConfirmed && (
              <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-700 rounded-md">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Join This Trip as Guest
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your name"
                    required
                  />
                  <button
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    disabled={!guestName.trim()}
                    onClick={() => setGuestNameConfirmed(true)}
                  >
                    Continue
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Required for guest users to join the trip
                  </p>
                </div>
              </div>
            )}

            {/* Selection Form - Show when guest has confirmed name and hasn't selected a day yet */}
            {!user && guestNameConfirmed && !guestSelectedDay && (
              <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-700 rounded-md">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Join This Trip
                </h3>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Your Name
                    </label>
                    <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-600 rounded border">
                      <span className="text-gray-900 dark:text-white">
                        {guestName}
                      </span>
                      <button
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                        onClick={() => setGuestNameConfirmed(false)}
                      >
                        Change
                      </button>
                    </div>
                  </div>
                </div>

                {/* Calendar component */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Select Available Days
                  </label>

                  {/* All Available Days Overview */}
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
                      All Available Trip Days ({trip.days.length} total)
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {trip.days.map((dayWithSelections) => {
                        const isAlreadySelected = userSelectedDays.includes(
                          dayWithSelections.tripDay.day,
                        );
                        const isCurrentlySelected = selectedDays.includes(
                          dayWithSelections.tripDay.day,
                        );

                        return (
                          <button
                            key={dayWithSelections.tripDay.id}
                            onClick={() => {
                              if (isAlreadySelected) {
                                // Don't allow clicking on already selected days
                                return;
                              }
                              if (isCurrentlySelected) {
                                handleDateDeselect(
                                  dayWithSelections.tripDay.day,
                                );
                              } else {
                                handleDateSelect(dayWithSelections.tripDay.day);
                              }
                            }}
                            disabled={isAlreadySelected}
                            className={cn(
                              "inline-flex items-center px-3 py-2 rounded-md text-sm font-medium border-2 transition-colors",
                              isAlreadySelected
                                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700 cursor-not-allowed"
                                : isCurrentlySelected
                                ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 cursor-pointer"
                                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer",
                            )}
                          >
                            <span>
                              {formatDate(dayWithSelections.tripDay.day)}
                            </span>
                            {isAlreadySelected && (
                              <Check className="ml-1 h-4 w-4" />
                            )}
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                              {selectionCounts[dayWithSelections.tripDay.day] ||
                                0}{" "}
                              available
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
                    <CalendarComponent
                      selectedDates={selectedDays}
                      joinedDates={userSelectedDays}
                      onDateSelect={handleDateSelect}
                      onDateDeselect={handleDateDeselect}
                      selectionCounts={selectionCounts}
                      availableDates={trip.days
                        .map(
                          (dayWithSelections) => dayWithSelections.tripDay.day,
                        )
                        .filter((date) => !userSelectedDays.includes(date))}
                      onDateRemove={user ? handleDeselectDay : undefined}
                      daysToRemove={daysToDeselect}
                      isLoggedIn={!!user}
                    />
                  </div>
                </div>

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

                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Selected Dates ({selectedDays.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedDays([])}
                    className="text-xs text-blue-400 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                  >
                    Clear all
                  </button>
                </div>
                {/* Selected dates display */}
                {selectedDays.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <div className="flex flex-wrap gap-2">
                      {selectedDays.map((date) => (
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
                            className="ml-1 text-blue-400 hover:text-blue-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  {selectedDays.length > 0 ? (
                    <>
                      <button
                        onClick={handleBulkChanges}
                        disabled={isSubmitting}
                        className="flex-1 flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Confirm Selection ({selectedDays.length} days)
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDays([]);
                          setNotes("");
                          // Don't clear guest name for guests, just reset the confirmation
                          if (!user) {
                            setGuestNameConfirmed(false);
                          } else {
                            setGuestName("");
                          }
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                      Select days to join this trip
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Selection Form for Logged-in Users */}
            {user && (
              <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-700 rounded-md">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {userSelectedDays.length > 0
                    ? "Add More Available Days"
                    : "Join This Trip"}
                </h3>

                {/* Show existing selections for logged-in users */}
                {userSelectedDays.length > 0 && (
                  <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                      Your Current Selections:
                    </h4>
                    <p className="text-xs text-green-700 dark:text-green-300 mb-3">
                      💡 Click on any day below to remove it from your
                      selections, or use the calendar below to add/remove days
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {userSelectedDays.map((date) => {
                        const isMarkedForDeselection =
                          daysToDeselect.includes(date);
                        return (
                          <button
                            key={date}
                            onClick={() => handleDeselectDay(date)}
                            className={cn(
                              "inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 border-2 cursor-pointer",
                              isMarkedForDeselection
                                ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 border-red-400 dark:border-red-500 shadow-md scale-105"
                                : "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 border-green-300 dark:border-green-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-500 hover:scale-105",
                            )}
                            title={
                              isMarkedForDeselection
                                ? "Click to keep this day"
                                : "Click to remove this day"
                            }
                          >
                            {isMarkedForDeselection ? (
                              <Trash2 className="h-4 w-4 mr-2" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-2 opacity-50" />
                            )}
                            {formatDate(date)}
                          </button>
                        );
                      })}
                    </div>
                    {daysToDeselect.length > 0 && (
                      <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-md border-2 border-red-200 dark:border-red-800 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
                            <div>
                              <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                                {daysToDeselect.length} day(s) marked for
                                removal
                              </span>
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                Click &quot;Confirm Changes&quot; below to apply
                                these changes
                              </p>
                            </div>
                          </div>
                          <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                            ⚠️ Pending
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Calendar component */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Select Available Days
                  </label>

                  {/* All Available Days Overview */}
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
                      All Available Trip Days ({trip.days.length} total)
                    </h4>
                    {user && userSelectedDays.length > 0 && (
                      <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                        💡 Your selected days are shown in green above. Click
                        the trash icon to remove them, or use the calendar below
                        to add/remove days.
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {trip.days.map((dayWithSelections) => {
                        const isAlreadySelected = userSelectedDays.includes(
                          dayWithSelections.tripDay.day,
                        );
                        const isCurrentlySelected = selectedDays.includes(
                          dayWithSelections.tripDay.day,
                        );
                        const isMarkedForDeselection = daysToDeselect.includes(
                          dayWithSelections.tripDay.day,
                        );

                        return (
                          <button
                            key={dayWithSelections.tripDay.id}
                            onClick={() => {
                              if (isAlreadySelected) {
                                // For logged-in users, allow clicking to deselect
                                if (user) {
                                  handleDeselectDay(
                                    dayWithSelections.tripDay.day,
                                  );
                                }
                                return;
                              }
                              if (isCurrentlySelected) {
                                handleDateDeselect(
                                  dayWithSelections.tripDay.day,
                                );
                              } else {
                                handleDateSelect(dayWithSelections.tripDay.day);
                              }
                            }}
                            disabled={!user && isAlreadySelected}
                            className={cn(
                              "inline-flex items-center px-3 py-2 rounded-md text-sm font-medium border-2 transition-all duration-200",
                              isAlreadySelected
                                ? user
                                  ? isMarkedForDeselection
                                    ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-400 dark:border-red-600 cursor-pointer hover:bg-red-200 dark:hover:bg-red-800"
                                    : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-600 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-500"
                                  : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700 cursor-not-allowed"
                                : isCurrentlySelected
                                ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 cursor-pointer"
                                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer",
                            )}
                            title={
                              isAlreadySelected && user
                                ? "Click the trash icon to remove this day"
                                : undefined
                            }
                          >
                            <span>
                              {formatDate(dayWithSelections.tripDay.day)}
                            </span>
                            {isAlreadySelected &&
                              (isMarkedForDeselection ? (
                                <Trash2 className="ml-1 h-4 w-4" />
                              ) : (
                                <Trash2 className="ml-1 h-4 w-4 opacity-50" />
                              ))}
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                              {selectionCounts[dayWithSelections.tripDay.day] ||
                                0}{" "}
                              Available
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
                    <CalendarComponent
                      selectedDates={selectedDays}
                      joinedDates={userSelectedDays}
                      onDateSelect={handleDateSelect}
                      onDateDeselect={handleDateDeselect}
                      selectionCounts={selectionCounts}
                      availableDates={trip.days
                        .map(
                          (dayWithSelections) => dayWithSelections.tripDay.day,
                        )
                        .filter((date) => !userSelectedDays.includes(date))}
                      onDateRemove={user ? handleDeselectDay : undefined}
                      daysToRemove={daysToDeselect}
                      isLoggedIn={!!user}
                    />
                  </div>
                </div>

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

                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Selected Dates ({selectedDays.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedDays([])}
                    className="text-xs text-blue-400 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                  >
                    Clear all
                  </button>
                </div>
                {/* Selected dates display */}
                {selectedDays.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <div className="flex flex-wrap gap-2">
                      {selectedDays.map((date) => (
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
                            className="ml-1 text-blue-400 hover:text-blue-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  {selectedDays.length > 0 || daysToDeselect.length > 0 ? (
                    <>
                      <button
                        onClick={handleBulkChanges}
                        disabled={isSubmitting || isDeselecting}
                        className="flex-1 flex justify-center items-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all duration-200 hover:shadow-xl"
                      >
                        {isSubmitting || isDeselecting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            <span className="font-medium">
                              Confirm Changes (
                              {selectedDays.length > 0
                                ? `${selectedDays.length} add`
                                : ""}
                              {selectedDays.length > 0 &&
                              daysToDeselect.length > 0
                                ? ", "
                                : ""}
                              {daysToDeselect.length > 0
                                ? `${daysToDeselect.length} remove`
                                : ""}
                              )
                            </span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDays([]);
                          setDaysToDeselect([]);
                          setNotes("");
                          // Don't clear guest name for guests, just reset the confirmation
                          if (!user) {
                            setGuestNameConfirmed(false);
                          } else {
                            setGuestName("");
                          }
                        }}
                        className="px-6 py-3 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <div className="w-full text-center py-4 text-sm text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800 rounded-md border border-dashed border-gray-300 dark:border-gray-600">
                      💡 Select days to add or remove to make changes
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Trip Days Summary */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Trip Days Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {trip.days.map((dayWithSelections) => {
                  const isUserSelected = userSelectedDays.includes(
                    dayWithSelections.tripDay.day,
                  );

                  return (
                    <div
                      key={dayWithSelections.tripDay.id}
                      className={cn(
                        "p-3 border rounded-md relative",
                        isUserSelected
                          ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20"
                          : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700",
                      )}
                    >
                      {isUserSelected && (
                        <div className="absolute top-2 right-2">
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                      )}
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatDate(dayWithSelections.tripDay.day)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {selectionCounts[dayWithSelections.tripDay.day] || 0}{" "}
                        people available
                      </div>
                      {isUserSelected && (
                        <div className="mt-1">
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            ✓ You&apos;re available
                          </span>
                        </div>
                      )}
                      {dayWithSelections.selections.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Participants:
                          </div>
                          <div className="space-y-1">
                            {dayWithSelections.selections.map((selection) => {
                              const isCurrentUser = user
                                ? selection.userId === user.id
                                : selection.guestName === guestName;

                              return (
                                <div
                                  key={selection.id}
                                  className={cn(
                                    "text-xs flex items-center",
                                    isCurrentUser
                                      ? "text-green-600 dark:text-green-400 font-medium"
                                      : "text-gray-500 dark:text-gray-400",
                                  )}
                                >
                                  <User className="h-3 w-3 mr-1" />
                                  {selection.guestName ||
                                    `User ${selection.userId}`}
                                  {isCurrentUser && " (You)"}
                                  {selection.notes && (
                                    <span className="ml-1 text-gray-400">
                                      - {selection.notes}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
