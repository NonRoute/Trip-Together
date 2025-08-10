"use client";

import { formatDate } from "@/lib/utils";
import { TripWithCreator } from "@/lib/api";
import { Calendar, MapPin, User, Loader2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { tripAPI } from "@/lib/api";
import { useState } from "react";

interface TripCardProps {
  trip: TripWithCreator;
  onDeleted?: (tripId: number) => void;
}

export default function TripCard({ trip, onDeleted }: TripCardProps) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = user && user.id === trip.creatorId;

  // Stable gradient selection based on trip id
  const gradientOptions = [
    "bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 dark:from-blue-900 dark:via-indigo-900 dark:to-purple-900",
    "bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100 dark:from-emerald-900 dark:via-teal-900 dark:to-cyan-900",
    "bg-gradient-to-br from-amber-100 via-orange-100 to-rose-100 dark:from-amber-900 dark:via-orange-900 dark:to-rose-900",
    "bg-gradient-to-br from-fuchsia-100 via-pink-100 to-rose-100 dark:from-fuchsia-900 dark:via-pink-900 dark:to-rose-900",
    "bg-gradient-to-br from-sky-100 via-blue-100 to-cyan-100 dark:from-sky-900 dark:via-blue-900 dark:to-cyan-900",
    "bg-gradient-to-br from-lime-100 via-emerald-100 to-teal-100 dark:from-lime-900 dark:via-emerald-900 dark:to-teal-900",
    "bg-gradient-to-br from-violet-100 via-indigo-100 to-slate-100 dark:from-violet-900 dark:via-indigo-900 dark:to-slate-900",
    "bg-gradient-to-br from-rose-100 via-pink-100 to-orange-100 dark:from-rose-900 dark:via-pink-900 dark:to-orange-900",
    "bg-gradient-to-br from-cyan-100 via-teal-100 to-green-100 dark:from-cyan-900 dark:via-teal-900 dark:to-green-900",
    "bg-gradient-to-br from-purple-100 via-fuchsia-100 to-pink-100 dark:from-purple-900 dark:via-fuchsia-900 dark:to-pink-900",
    "bg-gradient-to-br from-stone-100 via-neutral-100 to-slate-100 dark:from-stone-800 dark:via-neutral-800 dark:to-slate-800",
    "bg-gradient-to-br from-indigo-100 via-blue-100 to-sky-100 dark:from-indigo-900 dark:via-blue-900 dark:to-sky-900",
  ];
  const gradientClass =
    gradientOptions[Math.abs(trip.id) % gradientOptions.length];

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
      alert("Failed to delete trip");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-1 hover:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:ring-blue-600/40">
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {trip.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={trip.imageUrl}
            alt={trip.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className={`h-full w-full ${gradientClass}`} />
        )}

        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label="Delete trip"
            title="Delete trip"
            className="absolute right-3 top-3 inline-flex items-center rounded-md bg-white/90 p-1.5 text-gray-500 shadow-sm backdrop-blur transition hover:bg-red-50 hover:text-red-600 disabled:opacity-60 dark:bg-gray-900/70 dark:text-gray-300 dark:hover:bg-red-900/30"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      <div className="flex grow flex-col p-5">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="line-clamp-1 text-lg font-semibold text-gray-900 dark:text-white">
            {trip.title}
          </h3>
        </div>

        {trip.description && (
          <p className="mb-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
            {trip.description}
          </p>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          {trip.destination && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
              <MapPin className="h-3.5 w-3.5" />
              {trip.destination}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
            <Calendar className="h-3.5 w-3.5" />
            Created {formatDate(trip.createdAt)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <User className="h-4 w-4" />
          <span>Creator: {trip.creator}</span>
        </div>

        <div className="mt-auto pt-4 dark:border-gray-700">
          <Link
            href={`/trips/${trip.id}`}
            className="inline-flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
