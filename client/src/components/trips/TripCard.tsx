"use client";

import { Trip } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { TripWithCreator } from "@repo/types/schema/trips";
import { Calendar, MapPin, User } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { tripAPI } from "@/lib/api";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

interface TripCardProps {
  trip: TripWithCreator;
  onDeleted?: (tripId: number) => void;
}

export default function TripCard({ trip, onDeleted }: TripCardProps) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = user && user.id === trip.creatorId;

  const handleDelete = async () => {
    if (!canDelete) return;
    const confirmed = window.confirm(
      "Delete this trip? This will remove all its days and selections.",
    );
    if (!confirmed) return;
    try {
      setIsDeleting(true);
      await tripAPI.deleteTrip(trip.id);
      onDeleted?.(trip.id);
    } catch {
      // optional: surface error
      alert("Failed to delete trip");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className="p-6 flex flex-col justify-end h-full">
        <div className="flex items-start justify-between mb-auto">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {trip.title}
            </h3>
            {trip.description && (
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                {trip.description}
              </p>
            )}
          </div>
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              aria-label="Delete trip"
              className={`ml-2 inline-flex items-center p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 transition-opacity group-hover:opacity-100 ${
                isDeleting ? "opacity-100" : ""
              }`}
              title="Delete trip"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        <div className="space-y-2 mb-4">
          {trip.destination && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="h-4 w-4 mr-2" />
              <span>{trip.destination}</span>
            </div>
          )}

          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Created {formatDate(trip.createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <User className="h-4 w-4 mr-1" />
            <span>Creator: {trip.creator}</span>
          </div>

          <Link
            href={`/trips/${trip.id}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
