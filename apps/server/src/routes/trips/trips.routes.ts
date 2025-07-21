import { createRoute, z } from "@hono/zod-openapi";
import { authMiddleware } from "../../middleware/auth";
import { tripSchemas } from "./trips";

const tags = ["trip"];

export const createTrip = createRoute({
  method: "post",
  path: "/",
  middleware: [authMiddleware],
  tags,
  security: [
    {
      BearerAuth: [],
    },
  ],
  request: {
    body: {
      content: {
        "application/json": {
          schema: tripSchemas.createTrip,
          example: {
            title: "Weekend Beach Trip",
            description: "A fun weekend trip to the beach with friends",
            destination: "Miami Beach",
            days: ["2024-06-15", "2024-06-16", "2024-06-17"],
          },
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: tripSchemas.tripCreationResponse,
          example: {
            trip: {
              id: 1,
              title: "Weekend Beach Trip",
              description: "A fun weekend trip to the beach with friends",
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
              {
                id: 2,
                tripId: 1,
                day: "2024-06-16",
                createdAt: "2024-01-01T12:00:00Z",
              },
              {
                id: 3,
                tripId: 1,
                day: "2024-06-17",
                createdAt: "2024-01-01T12:00:00Z",
              },
            ],
          },
        },
      },
      description: "Trip created successfully with days",
    },
    400: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
          example: {
            error: "Invalid request data: days array is required",
          },
        },
      },
      description: "Invalid request data",
    },
    401: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
          example: {
            error: "Unauthorized: Please provide a valid authentication token",
          },
        },
      },
      description: "Unauthorized",
    },
    500: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
          example: {
            error: "Internal server error",
          },
        },
      },
      description: "Internal server error",
    },
  },
});

export const getTrips = createRoute({
  method: "get",
  path: "/",
  tags,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(tripSchemas.tripWithCreator).openapi({
            type: "array",
            description: "Array of trips with creator",
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
                creator: "John Doe",
              },
              {
                id: 2,
                title: "Mountain Hiking Adventure",
                description: "Explore the beautiful mountain trails",
                creatorId: 2,
                destination: "Rocky Mountains",
                isActive: true,
                createdAt: "2024-01-02T10:00:00Z",
                updatedAt: "2024-01-02T10:00:00Z",
                creator: "Jane Doe",
              },
            ],
          }),
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
            {
              id: 2,
              title: "Mountain Hiking Adventure",
              description: "Explore the beautiful mountain trails",
              creatorId: 2,
              destination: "Rocky Mountains",
              isActive: true,
              createdAt: "2024-01-02T10:00:00Z",
              updatedAt: "2024-01-02T10:00:00Z",
            },
          ],
        },
      },
      description: "List of trips",
    },
    500: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Internal server error",
    },
  },
});

export const getTrip = createRoute({
  method: "get",
  path: "/{tripId}",
  tags,
  request: {
    params: z
      .object({
        tripId: z.coerce.number().openapi({
          type: "number",
          example: 1,
          param: {
            name: "tripId",
            in: "path",
          },
        }),
      })
      .openapi("TripParams", {
        type: "number",
        param: {
          name: "tripId",
          in: "path",
        },
      }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: tripSchemas.tripWithDaysAndSelections,
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
                    guestName: null,
                    tripDayId: 1,
                    notes: "I can only join for half day",
                    createdAt: "2024-01-01T12:00:00Z",
                    updatedAt: "2024-01-01T12:00:00Z",
                  },
                  {
                    id: 2,
                    userId: null,
                    guestName: "John Doe",
                    tripDayId: 1,
                    notes: "Looking forward to this!",
                    createdAt: "2024-01-01T12:00:00Z",
                    updatedAt: "2024-01-01T12:00:00Z",
                  },
                ],
              },
              {
                tripDay: {
                  id: 2,
                  tripId: 1,
                  day: "2024-06-16",
                  createdAt: "2024-01-01T12:00:00Z",
                },
                selections: [],
              },
            ],
          },
        },
      },
      description: "Trip with days and user selections",
    },
    404: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
          example: {
            error: "Trip not found",
          },
        },
      },
      description: "Trip not found",
    },
    500: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Internal server error",
    },
  },
});

export const addTripDay = createRoute({
  method: "post",
  path: "/{tripId}/days",
  middleware: [authMiddleware],
  tags,
  security: [
    {
      BearerAuth: [],
    },
  ],
  request: {
    params: z
      .object({
        tripId: z.coerce.number().openapi({
          type: "number",
          description: "Trip ID",
          example: 1,
          param: {
            name: "tripId",
            in: "path",
          },
        }),
      })
      .openapi({
        type: "number",
        param: {
          name: "tripId",
          in: "path",
        },
      }),
    body: {
      content: {
        "application/json": {
          schema: tripSchemas.addTripDay,
          example: {
            day: "2024-06-18",
          },
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: tripSchemas.tripDay,
          example: {
            id: 3,
            tripId: 1,
            day: "2024-06-18",
            createdAt: "2024-01-01T14:00:00Z",
          },
        },
      },
      description: "Trip day added successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Invalid request data",
    },
    401: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Unauthorized",
    },
    404: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Trip not found",
    },
    500: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Internal server error",
    },
  },
});

export const getTripDay = createRoute({
  method: "get",
  path: "/{tripId}/days/{dayId}",
  tags,
  request: {
    params: z
      .object({
        tripId: z.coerce.number().openapi({
          type: "number",
          description: "Trip ID",
          example: 1,
          param: {
            name: "tripId",
            in: "path",
          },
        }),
        dayId: z.coerce.number().openapi({
          type: "number",
          description: "Trip day ID",
          example: 1,
          param: {
            name: "dayId",
            in: "path",
          },
        }),
      })
      .openapi({
        type: "object",
        param: {
          name: "tripId",
        },
        example: {
          tripId: 1,
          dayId: 1,
        },
      }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: tripSchemas.tripDayWithSelections,
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
                guestName: null,
                tripDayId: 1,
                notes: "I can only join for half day",
                createdAt: "2024-01-01T12:00:00Z",
                updatedAt: "2024-01-01T12:00:00Z",
              },
              {
                id: 2,
                userId: null,
                guestName: "John Doe",
                tripDayId: 1,
                notes: "Looking forward to this!",
                createdAt: "2024-01-01T13:00:00Z",
                updatedAt: "2024-01-01T13:00:00Z",
              },
            ],
          },
        },
      },
      description: "Trip day with selections",
    },
    404: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Trip day not found",
    },
    500: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Internal server error",
    },
  },
});

export const createDaySelection = createRoute({
  method: "post",
  path: "/{tripId}/days/{dayId}/selections",
  tags,
  middleware: [authMiddleware],
  security: [
    {
      BearerAuth: [],
    },
  ],
  request: {
    params: z
      .object({
        tripId: z.coerce.number().openapi({
          type: "number",
          description: "Trip ID",
          example: 1,
          param: {
            name: "tripId",
            in: "path",
          },
        }),
        dayId: z.coerce.number().openapi({
          type: "number",
          description: "Trip day ID",
          example: 1,
          param: {
            name: "dayId",
            in: "path",
          },
        }),
      })
      .openapi({
        type: "object",
        param: {
          name: "tripId",
        },
        example: {
          tripId: 1,
          dayId: 1,
        },
      }),
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              notes: z.string().optional().openapi({
                type: "string",
                description: "User notes",
                example: "I can only join for half day",
              }),
            })
            .openapi({
              type: "object",
              description: "Create day selection data for authenticated users",
              example: {
                notes:
                  "I can only join for half day, but looking forward to it!",
              },
            }),
          example: {
            notes: "I can only join for half day, but looking forward to it!",
          },
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: tripSchemas.userDaySelection,
          example: {
            id: 1,
            userId: 1,
            guestName: null,
            tripDayId: 1,
            notes: "I can only join for half day, but looking forward to it!",
            createdAt: "2024-01-01T15:00:00Z",
            updatedAt: "2024-01-01T15:00:00Z",
          },
        },
      },
      description: "Day selection created successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Invalid request data",
    },
    404: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Trip day not found",
    },
    500: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Internal server error",
    },
  },
});

export const updateDaySelection = createRoute({
  method: "put",
  path: "/{tripId}/days/{dayId}/selections/{selectionId}",
  middleware: [authMiddleware],
  tags,
  security: [
    {
      BearerAuth: [],
    },
  ],
  request: {
    params: z
      .object({
        tripId: z.coerce.number().openapi({
          type: "number",
          description: "Trip ID",
          example: 1,
          param: {
            name: "tripId",
            in: "path",
          },
        }),
        dayId: z.coerce.number().openapi({
          type: "number",
          description: "Trip day ID",
          example: 1,
          param: {
            name: "dayId",
            in: "path",
          },
        }),
        selectionId: z.coerce.number().openapi({
          type: "number",
          description: "Selection ID",
          example: 1,
          param: {
            name: "selectionId",
            in: "path",
          },
        }),
      })
      .openapi({
        type: "object",
        param: {
          name: "tripId",
          example: {
            tripId: 1,
            dayId: 1,
            selectionId: 1,
          },
        },
      }),
    body: {
      content: {
        "application/json": {
          schema: tripSchemas.createDaySelection,
          example: {
            notes: "Updated: I can join for the full day now!",
          },
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: tripSchemas.userDaySelection,
          example: {
            id: 1,
            userId: 1,
            guestName: null,
            tripDayId: 1,
            notes: "Updated: I can join for the full day now!",
            createdAt: "2024-01-01T15:00:00Z",
            updatedAt: "2024-01-01T16:00:00Z",
          },
        },
      },
      description: "Day selection updated successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Invalid request data",
    },
    401: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Unauthorized",
    },
    404: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Selection not found",
    },
    500: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Internal server error",
    },
  },
});

export const createGuestDaySelection = createRoute({
  method: "post",
  path: "/{tripId}/days/{dayId}/guest-selections",
  tags,
  request: {
    params: z
      .object({
        tripId: z.coerce.number().openapi({
          type: "number",
          description: "Trip ID",
          example: 1,
          param: {
            name: "tripId",
            in: "path",
          },
        }),
        dayId: z.coerce.number().openapi({
          type: "number",
          description: "Trip day ID",
          example: 1,
          param: {
            name: "dayId",
            in: "path",
          },
        }),
      })
      .openapi({
        type: "object",
        param: {
          name: "tripId",
        },
        example: {
          tripId: 1,
          dayId: 1,
        },
      }),
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              guestName: z.string().min(1, "Guest name is required").openapi({
                type: "string",
                description: "Guest name",
                example: "John Doe",
              }),
              notes: z.string().optional().openapi({
                type: "string",
                description: "Guest notes",
                example: "I can only join for half day",
              }),
            })
            .openapi({
              type: "object",
              description: "Create guest day selection data",
              example: {
                guestName: "John Doe",
                notes: "I can only join for half day",
              },
            }),
          example: {
            guestName: "John Doe",
            notes: "I can only join for half day, but looking forward to it!",
          },
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: tripSchemas.userDaySelection,
          example: {
            id: 1,
            userId: null,
            guestName: "John Doe",
            tripDayId: 1,
            notes: "I can only join for half day, but looking forward to it!",
            createdAt: "2024-01-01T15:00:00Z",
            updatedAt: "2024-01-01T15:00:00Z",
          },
        },
      },
      description: "Guest day selection created successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
          example: {
            error: "Guest name is required",
          },
        },
      },
      description: "Invalid request data",
    },
    404: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Trip day not found",
    },
    409: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
          example: {
            error: "Guest has already selected this day",
          },
        },
      },
      description: "Guest already selected this day",
    },
    500: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Internal server error",
    },
  },
});

export const deleteDaySelection = createRoute({
  method: "delete",
  path: "/{tripId}/days/{dayId}/selections/{selectionId}",
  middleware: [authMiddleware],
  tags,
  security: [
    {
      BearerAuth: [],
    },
  ],
  request: {
    params: z
      .object({
        tripId: z.coerce.number().openapi({
          type: "number",
          description: "Trip ID",
          example: 1,
          param: {
            name: "tripId",
            in: "path",
          },
        }),
        dayId: z.coerce.number().openapi({
          type: "number",
          description: "Trip day ID",
          example: 1,
          param: {
            name: "dayId",
            in: "path",
          },
        }),
        selectionId: z.coerce.number().openapi({
          type: "number",
          description: "Selection ID",
          example: 1,
          param: {
            name: "selectionId",
            in: "path",
          },
        }),
      })
      .openapi({
        type: "object",
        param: {
          name: "tripId",
        },
        example: {
          tripId: 1,
          dayId: 1,
          selectionId: 1,
        },
      }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: tripSchemas.success,
          example: {
            message: "Selection deleted successfully",
          },
        },
      },
      description: "Day selection deleted successfully",
    },
    401: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Unauthorized",
    },
    404: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Selection not found",
    },
    500: {
      content: {
        "application/json": {
          schema: tripSchemas.error,
        },
      },
      description: "Internal server error",
    },
  },
});
