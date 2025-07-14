import { db } from "@/db/connection";
import { tripDaysTable, tripsTable, userDaySelectionsTable } from "@/db/schema";
import { and, eq } from "drizzle-orm";
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
    .select()
    .from(tripsTable)
    .where(eq(tripsTable.isActive, true))
    .orderBy(tripsTable.createdAt);

  return c.json(trips, 200);
});

// Get a specific trip with its days
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

  const days = await db
    .select()
    .from(tripDaysTable)
    .where(eq(tripDaysTable.tripId, tripId))
    .orderBy(tripDaysTable.day);

  return c.json(
    {
      trip: trip[0]!,
      days: days,
    },
    200,
  );
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

// Create a day selection (for both logged in and guest users)
router.openapi(tripRoutes.createDaySelection, async (c) => {
  const { tripId, dayId } = c.req.valid("param");
  const { guestName, notes } = c.req.valid("json");
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

  // Validate that either userId (logged in) or guestName (guest) is provided
  if (!userId && !guestName) {
    return c.json(
      { error: "Either user must be logged in or guest name must be provided" },
      400,
    );
  }

  // Check if user already has a selection for this day
  const existingSelection = userId
    ? await db
        .select()
        .from(userDaySelectionsTable)
        .where(
          and(
            eq(userDaySelectionsTable.tripDayId, dayId),
            eq(userDaySelectionsTable.userId, userId),
          ),
        )
        .limit(1)
    : await db
        .select()
        .from(userDaySelectionsTable)
        .where(
          and(
            eq(userDaySelectionsTable.tripDayId, dayId),
            eq(userDaySelectionsTable.guestName, guestName!),
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
      guestName,
      tripDayId: dayId,
      notes,
    })
    .returning();

  if (!selection) {
    return c.json({ error: "Failed to create day selection" }, 500);
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
