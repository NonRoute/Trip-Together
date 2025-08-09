import { db } from "@/db/connection";
import {
  tripDaysTable,
  tripsTable,
  userDaySelectionsTable,
  usersTable,
} from "@/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { createOpenAPIApp } from "../../lib/openapi";
import * as tripRoutes from "./trips.routes";

const router = createOpenAPIApp();

// Create a new trip
router.openapi(tripRoutes.createTrip, async (c) => {
  const { title, description, destination, days } = c.req.valid("json");
  const userId = (c.var as any).userId;

  try {
    // Start a transaction to create trip and days together
    const result = await db.transaction(async (tx) => {
      // Create the trip
      const [trip] = await tx
        .insert(tripsTable)
        .values({
          title,
          description,
          destination,
          creatorId: userId,
        })
        .returning();

      if (!trip) {
        throw new Error("Failed to create trip");
      }

      // Create the trip days
      const tripDaysData = days.map((day: string) => ({
        tripId: trip.id,
        day,
      }));

      const createdDays = await tx
        .insert(tripDaysTable)
        .values(tripDaysData)
        .returning();

      return {
        trip,
        days: createdDays,
      };
    });

    return c.json(
      {
        trip: result.trip,
        days: result.days,
      },
      201,
    );
  } catch (error) {
    console.error("Failed to create trip:", error);
    return c.json({ error: "Failed to create trip" }, 500);
  }
});

// Get all trips
router.openapi(tripRoutes.getTrips, async (c) => {
  const trips = await db
    .select({
      trip: tripsTable,
      creator: usersTable.name,
    })
    .from(tripsTable)
    .leftJoin(usersTable, eq(tripsTable.creatorId, usersTable.id))
    .where(eq(tripsTable.isActive, true))
    .orderBy(desc(tripsTable.createdAt));

  const formattedTrips = trips.map((trip) => ({
    ...trip.trip,
    creator: trip.creator || null,
  }));

  return c.json(formattedTrips, 200);
});

// Get a specific trip with its days and user selections
router.openapi(tripRoutes.getTrip, async (c) => {
  const { tripId } = c.req.valid("param");

  const trip = await db
    .select()
    .from(tripsTable)
    .where(eq(tripsTable.id, tripId))
    .limit(1);

  if (!trip.length) {
    return c.json({ error: "Trip not found" }, 404);
  }

  // Get all days with their selections in a single query using LEFT JOIN
  const daysWithSelections = await db
    .select({
      // Trip day fields
      dayId: tripDaysTable.id,
      dayTripId: tripDaysTable.tripId,
      day: tripDaysTable.day,
      dayCreatedAt: tripDaysTable.createdAt,
      // Selection fields (nullable due to LEFT JOIN)
      selectionId: userDaySelectionsTable.id,
      userId: userDaySelectionsTable.userId,
      guestName: userDaySelectionsTable.guestName,
      tripDayId: userDaySelectionsTable.tripDayId,
      notes: userDaySelectionsTable.notes,
      selectionCreatedAt: userDaySelectionsTable.createdAt,
      selectionUpdatedAt: userDaySelectionsTable.updatedAt,
    })
    .from(tripDaysTable)
    .leftJoin(
      userDaySelectionsTable,
      eq(tripDaysTable.id, userDaySelectionsTable.tripDayId),
    )
    .where(eq(tripDaysTable.tripId, tripId))
    .orderBy(tripDaysTable.day, userDaySelectionsTable.createdAt);

  // Group the results by day
  const daysMap = new Map();

  daysWithSelections.forEach((row) => {
    const dayKey = row.dayId;

    if (!daysMap.has(dayKey)) {
      // Create the day object
      daysMap.set(dayKey, {
        tripDay: {
          id: row.dayId,
          tripId: row.dayTripId,
          day: row.day,
          createdAt: row.dayCreatedAt,
        },
        selections: [],
      });
    }

    // Add selection if it exists (not null due to LEFT JOIN)
    if (row.selectionId) {
      daysMap.get(dayKey).selections.push({
        id: row.selectionId,
        userId: row.userId,
        guestName: row.guestName,
        tripDayId: row.tripDayId,
        notes: row.notes,
        createdAt: row.selectionCreatedAt,
        updatedAt: row.selectionUpdatedAt,
      });
    }
  });

  const days = Array.from(daysMap.values());

  return c.json(
    {
      trip: trip[0]!,
      days: days,
    },
    200,
  );
});

// Delete a trip (only creator)
router.openapi(tripRoutes.deleteTrip, async (c) => {
  const { tripId } = c.req.valid("param");
  const userId = (c.var as any).userId;

  // Verify trip exists and belongs to user
  const trip = await db
    .select()
    .from(tripsTable)
    .where(and(eq(tripsTable.id, tripId), eq(tripsTable.creatorId, userId)))
    .limit(1);

  if (!trip.length) {
    return c.json(
      { error: "Trip not found or you don't have permission" },
      404,
    );
  }

  // Deleting trip will cascade delete trip days and selections due to FK constraints
  await db.delete(tripsTable).where(eq(tripsTable.id, tripId));

  return c.json({ message: "Trip deleted successfully" }, 200);
});

// Add a day to a trip
router.openapi(tripRoutes.addTripDay, async (c) => {
  const { tripId } = c.req.valid("param");
  const { day } = c.req.valid("json");
  const userId = (c.var as any).userId;

  // Check if trip exists and user is the creator
  const trip = await db
    .select()
    .from(tripsTable)
    .where(and(eq(tripsTable.id, tripId), eq(tripsTable.creatorId, userId)))
    .limit(1);

  if (!trip.length) {
    return c.json(
      { error: "Trip not found or you don't have permission" },
      404,
    );
  }

  // Check if day already exists
  const existingDay = await db
    .select()
    .from(tripDaysTable)
    .where(and(eq(tripDaysTable.tripId, tripId), eq(tripDaysTable.day, day)))
    .limit(1);

  if (existingDay.length) {
    return c.json({ error: "Day already exists for this trip" }, 400);
  }

  const [tripDay] = await db
    .insert(tripDaysTable)
    .values({
      tripId,
      day,
    })
    .returning();

  if (!tripDay) {
    return c.json({ error: "Failed to add trip day" }, 500);
  }

  return c.json(tripDay, 201);
});

// Get a specific trip day with selections
router.openapi(tripRoutes.getTripDay, async (c) => {
  const { tripId, dayId } = c.req.valid("param");

  const tripDay = await db
    .select()
    .from(tripDaysTable)
    .where(and(eq(tripDaysTable.id, dayId), eq(tripDaysTable.tripId, tripId)))
    .limit(1);

  if (!tripDay.length) {
    return c.json({ error: "Trip day not found" }, 404);
  }

  const selections = await db
    .select({
      id: userDaySelectionsTable.id,
      userId: userDaySelectionsTable.userId,
      guestName: userDaySelectionsTable.guestName,
      tripDayId: userDaySelectionsTable.tripDayId,
      notes: userDaySelectionsTable.notes,
      createdAt: userDaySelectionsTable.createdAt,
      updatedAt: userDaySelectionsTable.updatedAt,
    })
    .from(userDaySelectionsTable)
    .where(eq(userDaySelectionsTable.tripDayId, dayId))
    .orderBy(userDaySelectionsTable.createdAt);

  return c.json(
    {
      tripDay: tripDay[0]!,
      selections: selections,
    },
    200,
  );
});

// Create a day selection (for authenticated users only)
router.openapi(tripRoutes.createDaySelection, async (c) => {
  const { tripId, dayId } = c.req.valid("param");
  const { notes } = c.req.valid("json");
  const userId = (c.var as any).userId;

  // Check if trip day exists
  const tripDay = await db
    .select()
    .from(tripDaysTable)
    .where(and(eq(tripDaysTable.id, dayId), eq(tripDaysTable.tripId, tripId)))
    .limit(1);

  if (!tripDay.length) {
    return c.json({ error: "Trip day not found" }, 404);
  }

  // Check if user already has a selection for this day
  const existingSelection = await db
    .select()
    .from(userDaySelectionsTable)
    .where(
      and(
        eq(userDaySelectionsTable.tripDayId, dayId),
        eq(userDaySelectionsTable.userId, userId),
      ),
    )
    .limit(1);

  if (existingSelection.length) {
    return c.json({ error: "You already have a selection for this day" }, 400);
  }

  const [selection] = await db
    .insert(userDaySelectionsTable)
    .values({
      userId,
      guestName: null,
      tripDayId: dayId,
      notes,
    })
    .returning();

  if (!selection) {
    return c.json({ error: "Failed to create day selection" }, 500);
  }

  return c.json(selection, 201);
});

// Create a guest day selection (no authentication required)
router.openapi(tripRoutes.createGuestDaySelection, async (c) => {
  const { tripId, dayId } = c.req.valid("param");
  const { guestName, notes } = c.req.valid("json");

  // Check if trip day exists
  const tripDay = await db
    .select()
    .from(tripDaysTable)
    .where(and(eq(tripDaysTable.id, dayId), eq(tripDaysTable.tripId, tripId)))
    .limit(1);

  if (!tripDay.length) {
    return c.json({ error: "Trip day not found" }, 404);
  }

  // Check if guest already has a selection for ANY day in this trip
  const tripDayIds = await db
    .select({ id: tripDaysTable.id })
    .from(tripDaysTable)
    .where(eq(tripDaysTable.tripId, tripId));
  const tripDayIdList = tripDayIds.map((row) => row.id);

  const existingSelection = await db
    .select()
    .from(userDaySelectionsTable)
    .where(
      and(
        eq(userDaySelectionsTable.guestName, guestName),
        inArray(userDaySelectionsTable.tripDayId, tripDayIdList),
      ),
    )
    .limit(1);

  if (existingSelection.length) {
    return c.json(
      { error: "Guest has already selected a day for this trip" },
      409,
    );
  }

  const [selection] = await db
    .insert(userDaySelectionsTable)
    .values({
      userId: null,
      guestName,
      tripDayId: dayId,
      notes,
    })
    .returning();

  if (!selection) {
    return c.json({ error: "Failed to create guest day selection" }, 500);
  }

  return c.json(selection, 201);
});

// Update a day selection (only for logged in users)
router.openapi(tripRoutes.updateDaySelection, async (c) => {
  const { tripId, dayId, selectionId } = c.req.valid("param");
  const { notes } = c.req.valid("json");
  const userId = (c.var as any).userId;

  // Check if selection exists and belongs to the user
  const selection = await db
    .select()
    .from(userDaySelectionsTable)
    .where(
      and(
        eq(userDaySelectionsTable.id, selectionId),
        eq(userDaySelectionsTable.tripDayId, dayId),
        eq(userDaySelectionsTable.userId, userId),
      ),
    )
    .limit(1);

  if (!selection.length) {
    return c.json(
      { error: "Selection not found or you don't have permission" },
      404,
    );
  }

  const [updatedSelection] = await db
    .update(userDaySelectionsTable)
    .set({
      notes,
      updatedAt: new Date(),
    })
    .where(eq(userDaySelectionsTable.id, selectionId))
    .returning();

  if (!updatedSelection) {
    return c.json({ error: "Failed to update selection" }, 500);
  }

  return c.json(updatedSelection, 200);
});

// Delete a day selection (only for logged in users)
router.openapi(tripRoutes.deleteDaySelection, async (c) => {
  const { tripId, dayId, selectionId } = c.req.valid("param");
  const userId = (c.var as any).userId;

  // Check if selection exists and belongs to the user
  const selection = await db
    .select()
    .from(userDaySelectionsTable)
    .where(
      and(
        eq(userDaySelectionsTable.id, selectionId),
        eq(userDaySelectionsTable.tripDayId, dayId),
        eq(userDaySelectionsTable.userId, userId),
      ),
    )
    .limit(1);

  if (!selection.length) {
    return c.json(
      { error: "Selection not found or you don't have permission" },
      404,
    );
  }

  await db
    .delete(userDaySelectionsTable)
    .where(eq(userDaySelectionsTable.id, selectionId));

  return c.json({ message: "Selection deleted successfully" }, 200);
});

export default router;
