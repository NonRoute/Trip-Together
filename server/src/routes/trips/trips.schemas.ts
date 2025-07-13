import { z } from "@hono/zod-openapi";

// Trip schema
export const tripSchema = z
  .object({
    id: z.number().openapi({
      type: "number",
      description: "Trip ID",
      example: 1,
    }),
    title: z.string().openapi({
      type: "string",
      description: "Trip title",
      example: "Weekend Beach Trip",
    }),
    description: z.string().nullable().openapi({
      type: "string",
      description: "Trip description",
      example: "A fun weekend trip to the beach",
    }),
    creatorId: z.number().openapi({
      type: "number",
      description: "ID of the user who created the trip",
      example: 1,
    }),
    destination: z.string().nullable().openapi({
      type: "string",
      description: "Trip destination",
      example: "Miami Beach",
    }),
    isActive: z.boolean().openapi({
      type: "boolean",
      description: "Whether the trip is active",
      example: true,
    }),
    createdAt: z.string().openapi({
      type: "string",
      format: "date-time",
      description: "Trip creation timestamp",
      example: "2024-01-01T12:00:00Z",
    }),
    updatedAt: z.string().openapi({
      type: "string",
      format: "date-time",
      description: "Trip last update timestamp",
      example: "2024-01-01T12:00:00Z",
    }),
  })
  .openapi({
    type: "object",
    description: "Trip object",
    example: {
      id: 1,
      title: "Weekend Beach Trip",
      description: "A fun weekend trip to the beach",
      creatorId: 1,
      destination: "Miami Beach",
      isActive: true,
      createdAt: "2024-01-01T12:00:00Z",
      updatedAt: "2024-01-01T12:00:00Z",
    },
  });

// Create trip schema
export const createTripSchema = z
  .object({
    title: z.string().min(1, "Title is required").openapi({
      type: "string",
      description: "Trip title",
      example: "Weekend Beach Trip",
    }),
    description: z.string().optional().openapi({
      type: "string",
      description: "Trip description",
      example: "A fun weekend trip to the beach",
    }),
    destination: z.string().optional().openapi({
      type: "string",
      description: "Trip destination",
      example: "Miami Beach",
    }),
  })
  .openapi({
    type: "object",
    description: "Create trip data",
    example: {
      title: "Weekend Beach Trip",
      description: "A fun weekend trip to the beach",
      destination: "Miami Beach",
    },
  });

// Trip day schema
export const tripDaySchema = z
  .object({
    id: z.number().openapi({
      type: "number",
      description: "Trip day ID",
      example: 1,
    }),
    tripId: z.number().openapi({
      type: "number",
      description: "Trip ID",
      example: 1,
    }),
    day: z.string().openapi({
      type: "string",
      format: "date",
      description: "Trip day",
      example: "2024-06-15",
    }),
    createdAt: z.string().openapi({
      type: "string",
      format: "date-time",
      description: "Trip day creation timestamp",
      example: "2024-01-01T12:00:00Z",
    }),
  })
  .openapi({
    type: "object",
    description: "Trip day object",
    example: {
      id: 1,
      tripId: 1,
      day: "2024-06-15",
      createdAt: "2024-01-01T12:00:00Z",
    },
  });

// Add trip day schema
export const addTripDaySchema = z
  .object({
    day: z.string().openapi({
      type: "string",
      format: "date",
      description: "Trip day",
      example: "2024-06-15",
    }),
  })
  .openapi({
    type: "object",
    description: "Add trip day data",
    example: {
      day: "2024-06-15",
    },
  });

// User day selection schema
export const userDaySelectionSchema = z
  .object({
    id: z.number().openapi({
      type: "number",
      description: "Selection ID",
      example: 1,
    }),
    userId: z.number().nullable().openapi({
      type: "number",
      description: "User ID (if logged in)",
      example: 1,
    }),
    guestName: z.string().nullable().openapi({
      type: "string",
      description: "Guest name (if not logged in)",
      example: "John Doe",
    }),
    tripDayId: z.number().openapi({
      type: "number",
      description: "Trip day ID",
      example: 1,
    }),
    notes: z.string().nullable().openapi({
      type: "string",
      description: "User notes",
      example: "I can only join for half day",
    }),
    createdAt: z.string().openapi({
      type: "string",
      format: "date-time",
      description: "Selection creation timestamp",
      example: "2024-01-01T12:00:00Z",
    }),
    updatedAt: z.string().openapi({
      type: "string",
      format: "date-time",
      description: "Selection last update timestamp",
      example: "2024-01-01T12:00:00Z",
    }),
  })
  .openapi({
    type: "object",
    description: "User day selection object",
    example: {
      id: 1,
      userId: 1,
      guestName: "John Doe",
      tripDayId: 1,
      notes: "I can only join for half day",
      createdAt: "2024-01-01T12:00:00Z",
      updatedAt: "2024-01-01T12:00:00Z",
    },
  });

// Create day selection schema
export const createDaySelectionSchema = z
  .object({
    guestName: z.string().optional().openapi({
      type: "string",
      description: "Guest name (required if not logged in)",
      example: "John Doe",
    }),
    notes: z.string().optional().openapi({
      type: "string",
      description: "User notes",
      example: "I can only join for half day",
    }),
  })
  .openapi({
    type: "object",
    description: "Create day selection data",
    example: {
      guestName: "John Doe",
      notes: "I can only join for half day",
    },
  });

// Trip with days schema
export const tripWithDaysSchema = z
  .object({
    trip: tripSchema,
    days: z.array(tripDaySchema).openapi({
      type: "array",
      description: "Trip days",
    }),
  })
  .openapi({
    type: "object",
    description: "Trip with its days",
    example: {
      trip: {
        id: 1,
        title: "Weekend Beach Trip",
        description: "A fun weekend trip to the beach",
        creatorId: 1,
        destination: "Miami Beach",
        isActive: true,
        createdAt: "2024-01-01T12:00:00Z",
        updatedAt: "2024-01-01T12:00:00Z",
      },
      days: [
        {
          id: 1,
          tripId: 1,
          day: "2024-06-15",
          createdAt: "2024-01-01T12:00:00Z",
        },
      ],
    },
  });

// Trip day with selections schema
export const tripDayWithSelectionsSchema = z
  .object({
    tripDay: tripDaySchema,
    selections: z.array(userDaySelectionSchema).openapi({
      type: "array",
      description: "User selections for this day",
    }),
  })
  .openapi({
    type: "object",
    description: "Trip day with user selections",
    example: {
      tripDay: {
        id: 1,
        tripId: 1,
        day: "2024-06-15",
        createdAt: "2024-01-01T12:00:00Z",
      },
      selections: [
        {
          id: 1,
          userId: 1,
          guestName: "John Doe",
          tripDayId: 1,
          notes: "I can only join for half day",
          createdAt: "2024-01-01T12:00:00Z",
          updatedAt: "2024-01-01T12:00:00Z",
        },
      ],
    },
  });

// Common response schemas
export const errorSchema = z
  .object({
    error: z.string().openapi({
      type: "string",
      description: "Error message",
      example: "Trip not found",
    }),
  })
  .openapi({
    type: "object",
    description: "Error response",
    example: {
      error: "Trip not found",
    },
  });

export const successSchema = z
  .object({
    message: z.string().openapi({
      type: "string",
      description: "Success message",
      example: "Trip created successfully",
    }),
  })
  .openapi({
    type: "object",
    description: "Success response",
    example: {
      message: "Trip created successfully",
    },
  });

// Trip array schema
export const tripsArraySchema = z.array(tripSchema).openapi({
  type: "array",
  description: "Array of trips",
  example: [
    {
      id: 1,
      title: "Weekend Beach Trip",
      description: "A fun weekend trip to the beach",
      creatorId: 1,
      destination: "Miami Beach",
      isActive: true,
      createdAt: "2024-01-01T12:00:00Z",
      updatedAt: "2024-01-01T12:00:00Z",
    },
  ],
});

export const tripSchemas = {
  trip: tripSchema,
  tripsArray: tripsArraySchema,
  createTrip: createTripSchema,
  tripDay: tripDaySchema,
  addTripDay: addTripDaySchema,
  userDaySelection: userDaySelectionSchema,
  createDaySelection: createDaySelectionSchema,
  tripWithDays: tripWithDaysSchema,
  tripDayWithSelections: tripDayWithSelectionsSchema,
  error: errorSchema,
  success: successSchema,
};
