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
  UserRound,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [deletingTrip, setDeletingTrip] = useState(false);

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
          {user && user.id === trip.trip.creatorId && (
            <button
              onClick={async () => {
                const ok = window.confirm(
                  "Delete this trip? This will remove all its days and selections.",
                );
                if (!ok) return;
                try {
                  setDeletingTrip(true);
                  await tripAPI.deleteTrip(trip.trip.id);
                  router.push("/");
                } catch {
                  alert("Failed to delete trip");
                } finally {
                  setDeletingTrip(false);
                }
              }}
              disabled={deletingTrip}
              aria-label="Delete trip"
              className="inline-flex items-center p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
              title="Delete trip"
            >
              {deletingTrip ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trip.trip.destination && (
            <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
              <MapPin className="h-4 w-4 mr-2" />
              <span>{trip.trip.destination}</span>
            </div>
          )}
          <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Created {formatDate(trip.trip.createdAt)}</span>
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
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Availability
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pick the days you can join.
              </p>
            </div>

            {/* After confirming name, show selection UI or already selected message */}
            {!user && guestNameConfirmed && guestSelectedDay ? (
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md flex items-center justify-between">
                <div className="text-sm">
                  <span className="mr-2">You already selected:</span>
                  <span className="font-semibold">
                    {formatDate(guestSelectedDay)}
                  </span>
                </div>
                <button
                  className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-md text-sm"
                  onClick={() => setGuestNameConfirmed(false)}
                >
                  Change name
                </button>
              </div>
            ) : null}

            {/* Guest Name Input - Show when guest hasn't confirmed name yet */}
            {!user && !guestNameConfirmed && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your name"
                  />
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
                    disabled={!guestName.trim()}
                    onClick={() => setGuestNameConfirmed(true)}
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Selection Form - Unified for user or confirmed guest */}
            {(user || (!user && guestNameConfirmed && !guestSelectedDay)) && (
              <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-700 rounded-md">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Choose days
                </h3>

                {!user && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Your name
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
                )}

                {/* Calendar component */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select available days
                  </label>
                  {user && userSelectedDays.length > 0 && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                      Your days are in green. Click a green chip to mark it for
                      removal.
                    </p>
                  )}

                  {/* Overview chips */}
                  <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <div className="flex flex-wrap gap-2">
                      {trip.days.map((dayWithSelections) => {
                        const dateStr = dayWithSelections.tripDay.day;
                        const isAlreadySelected =
                          userSelectedDays.includes(dateStr);
                        const isCurrentlySelected =
                          selectedDays.includes(dateStr);
                        const isMarkedForDeselection =
                          daysToDeselect.includes(dateStr);

                        return (
                          <button
                            key={dayWithSelections.tripDay.id}
                            onClick={() => {
                              if (isAlreadySelected) {
                                if (user) handleDeselectDay(dateStr);
                                return;
                              }
                              if (isCurrentlySelected) {
                                handleDateDeselect(dateStr);
                              } else {
                                handleDateSelect(dateStr);
                              }
                            }}
                            disabled={!user && isAlreadySelected}
                            className={cn(
                              "inline-flex items-center px-3 py-2 rounded-md text-sm font-medium border transition-colors cursor-pointer",
                              isAlreadySelected
                                ? user
                                  ? isMarkedForDeselection
                                    ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300"
                                    : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300"
                                  : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 cursor-not-allowed"
                                : isCurrentlySelected
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 hover:border-blue-400",
                            )}
                            title={
                              isAlreadySelected && user
                                ? isMarkedForDeselection
                                  ? "Click to keep this day"
                                  : "Click to remove this day"
                                : undefined
                            }
                          >
                            <span>{formatDate(dateStr)}</span>
                            {isAlreadySelected && user && (
                              <Trash2
                                className={cn(
                                  "ml-2 h-4 w-4",
                                  isMarkedForDeselection
                                    ? "text-red-600"
                                    : "opacity-60",
                                )}
                              />
                            )}
                            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center">
                              <UserRound className="h-3 w-3 mr-1" />
                              {selectionCounts[dateStr] || 0}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {false && user && daysToDeselect.length > 0 && <div />}

                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
                    <CalendarComponent
                      selectedDates={selectedDays}
                      joinedDates={userSelectedDays}
                      onDateSelect={handleDateSelect}
                      onDateDeselect={handleDateDeselect}
                      selectionCounts={selectionCounts}
                      availableDates={trip.days
                        .map((d) => d.tripDay.day)
                        .filter((date) => !userSelectedDays.includes(date))}
                      onDateRemove={user ? handleDeselectDay : undefined}
                      daysToRemove={daysToDeselect}
                      isLoggedIn={!!user}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional"
                  />
                </div>

                {(selectedDays.length > 0 ||
                  (user && daysToDeselect.length > 0)) && (
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Review changes
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        {selectedDays.length > 0 &&
                          `${selectedDays.length} to add`}
                        {selectedDays.length > 0 &&
                          user &&
                          daysToDeselect.length > 0 &&
                          " • "}
                        {user &&
                          daysToDeselect.length > 0 &&
                          `${daysToDeselect.length} to remove`}
                      </span>
                    </div>

                    {selectedDays.length > 0 && (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Selected ({selectedDays.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedDays([])}
                            className="text-xs text-blue-500 hover:text-blue-700"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="mb-3">
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
                      </>
                    )}

                    {user && daysToDeselect.length > 0 && (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-red-900 dark:text-red-200">
                            Marked for removal ({daysToDeselect.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => setDaysToDeselect([])}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Clear
                          </button>
                        </div>
                        <div>
                          <div className="flex flex-wrap gap-2">
                            {daysToDeselect.map((date) => (
                              <span
                                key={date}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              >
                                {new Date(date).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                                <button
                                  type="button"
                                  onClick={() => handleDeselectDay(date)}
                                  className="ml-1 text-red-500 hover:text-red-800"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div className="flex space-x-3">
                  {selectedDays.length > 0 ||
                  (user && daysToDeselect.length > 0) ? (
                    <>
                      <button
                        onClick={handleBulkChanges}
                        disabled={isSubmitting || isDeselecting}
                        className="flex-1 flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting || isDeselecting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            {`Confirm changes`}
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDays([]);
                          setDaysToDeselect([]);
                          setNotes("");
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
                    <div className="w-full text-center py-3 text-sm text-gray-500 dark:text-gray-400 italic">
                      Select days to continue
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Removed duplicated logged-in section in favor of unified panel above */}

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
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <UserRound className="h-3 w-3 mr-1" />
                        {selectionCounts[dayWithSelections.tripDay.day] || 0}
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
