"use client";

import { Trip } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { TripWithCreator } from "@repo/types/schema/trips";
import { Calendar, MapPin, User } from "lucide-react";
import Link from "next/link";

interface TripCardProps {
  trip: TripWithCreator;
}

export default function TripCard({ trip }: TripCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
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
